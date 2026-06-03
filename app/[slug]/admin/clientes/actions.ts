"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { z } from "zod"
import { Role } from "@prisma/client"
import { formatLastVisit } from "@/lib/date-utils"
import { calculateAppointmentPrice } from "@/lib/appointments"
import { getTerminology } from "@/lib/dictionaries"



const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido").optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "OWNER", "STAFF", "CUSTOMER"]),
  shopId: z.string().min(1, "El ID de la tienda es obligatorio"),
  serviceIds: z.string()
    .optional()
    .transform((val) => {
      try {
        return val ? JSON.parse(val) : []
      } catch {
        return []
      }
    })
    .pipe(z.array(z.string())),
})

export async function createUser(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    shopId: formData.get("shopId"),
    serviceIds: formData.get("serviceIds"),
  }

  const validated = userSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const { name, email, phone, role, shopId: targetShopId, serviceIds } = validated.data

  // Validate: STAFF/OWNER must have service selection (even if empty = "Ninguno")
  if ((role === "STAFF" || role === "OWNER") && formData.get("serviceIds") === null) {
    return { success: false, error: "Debes seleccionar al menos un servicio (o 'Ninguno')" }
  }

  try {
    // SECURITY FIX: Mandatory targetShopId validation
    const { role: currentUserRole, isSuperAdmin, user: inviter } = await requireAdmin(targetShopId)

    if (currentUserRole === "STAFF") {
      if (role !== "CUSTOMER") throw new Error("Personal solo puede crear clientes")
    } else if (currentUserRole === "OWNER") {
      if (role !== "STAFF" && role !== "CUSTOMER") throw new Error("Dueños solo pueden crear personal y clientes")
    } else if (!isSuperAdmin) {
      throw new Error("No autorizado para esta tienda")
    }

    if (role === "SUPER_ADMIN" && !isSuperAdmin) throw new Error("Solo los Super Admins pueden crear otros Super Admins")

    // Fetch the target shop so we can include its branding in the invite email
    const shop = await prisma.shop.findUnique({
      where: { id: targetShopId },
      select: { id: true, slug: true, name: true, logoUrl: true }
    })
    if (!shop) throw new Error("Tienda no encontrada")

    const supabaseAdmin = createServiceRoleClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

    // 1. Invite the user via email — they set their own password by clicking the link.
    //    No temporary credentials are ever generated or stored.
    let authUser: any
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name,
        phone,
        role,
        shop_slug: shop.slug,
        shop_name: shop.name,
        shop_logo_url: shop.logoUrl ?? null,
        invited_by: (inviter as any).name ?? (inviter as any).email,
      },
      redirectTo: `${siteUrl}/${shop.slug}/update-password`,
    })

    if (inviteError) {
      // User already exists in Auth — link them to this shop without re-inviting.
      const msg = inviteError.message.toLowerCase()
      const alreadyExists = msg.includes("already") || msg.includes("registered") || msg.includes("exist")
      if (!alreadyExists) throw new Error(inviteError.message)

      const { data: list } = await supabaseAdmin.auth.admin.listUsers()
      const existing = list?.users.find((u: any) => u.email === email)
      if (!existing) throw new Error("El usuario ya existe en Auth pero no se pudo recuperar")
      authUser = existing
    } else {
      authUser = inviteData.user
    }

    if (!authUser) throw new Error("No se pudo crear o recuperar el usuario en Auth")

    // 2. Create or Update in Prisma using the Auth UUID
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        id: authUser.id,
        name,
        phone,
      },
      create: {
        id: authUser.id,
        email,
        name,
        phone,
      }
    })

    // 3. Link to Shop
    if (targetShopId && targetShopId !== "ALL") {
      await prisma.shopMember.upsert({
        where: { userId_shopId: { userId: user.id, shopId: targetShopId } },
        update: { role, isActive: true },
        create: { userId: user.id, shopId: targetShopId, role, isActive: true }
      })
    }

    // 4. Assign services for STAFF/OWNER roles
    if (role === "STAFF" || role === "OWNER") {
      // Cross-tenant validation
      if (serviceIds && serviceIds.length > 0) {
        const validServices = await prisma.service.findMany({
          where: { id: { in: serviceIds }, shopId: targetShopId }
        })
        if (validServices.length !== serviceIds.length) {
          throw new Error("Servicios inválidos o no pertenecen a esta tienda")
        }
      }

      const currentShopServices = await prisma.service.findMany({
        where: { shopId: targetShopId, staffMembers: { some: { id: user.id } } },
        select: { id: true }
      })

      await prisma.user.update({
        where: { id: user.id },
        data: {
          staffServices: {
            disconnect: currentShopServices.map(s => ({ id: s.id })),
            connect: serviceIds.map(id => ({ id }))
          }
        }
      })
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    console.error("CREATE_USER_ERROR:", error)
    return { success: false, error: error.message || "Error al crear el usuario" } as const
  }
}

const getShopServicesSchema = z.string().min(1, "El ID de la tienda es obligatorio")

export async function getShopServices(shopIdRaw: string) {
  try {
    const validated = getShopServicesSchema.safeParse(shopIdRaw)
    if (!validated.success) throw new Error("Parámetros inválidos")
    const shopId = validated.data

    await requireAdmin(shopId)
    const services = await prisma.service.findMany({
      where: { shopId },
      select: { id: true, name: true, duration: true },
      orderBy: { name: "asc" }
    })
    return { success: true, data: services } as const
  } catch (error: any) {
    return { success: false, error: error.message } as const
  }
}

const getClientDetailsSchema = z.object({
  clientId: z.string().min(1, "El ID del cliente es obligatorio"),
  shopId: z.string().min(1, "El ID de la tienda es obligatorio")
})

export async function getClientDetails(clientIdRaw: string, shopIdRaw: string) {
  try {
    const validated = getClientDetailsSchema.safeParse({ clientId: clientIdRaw, shopId: shopIdRaw })
    if (!validated.success) throw new Error("Parámetros inválidos")
    const { clientId, shopId } = validated.data

    const { businessType } = await requireAdmin(shopId)
    const t = getTerminology(businessType as any)

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        appointmentsAsCustomer: {
          where: { shopId }, // Always scoped to shopId as per user request
          include: {
            staff: { select: { id: true, name: true } },
            services: { select: { id: true, name: true, price: true } },
            service: { select: { id: true, name: true, price: true } }, // Legacy support
            notes: {
              include: { author: { select: { name: true, email: true } } },
              orderBy: { createdAt: "desc" }
            }
          },
          orderBy: { startTime: "desc" },
          take: 5
        }
      }
    })

    if (!client) return { success: false, error: `${t.client} no encontrado` } as const

    return { success: true, data: client } as const
  } catch (error) {
    console.error("GET_CLIENT_DETAILS_ERROR:", error)
    return { success: false, error: "Error al obtener detalles del cliente" } as const
  }
}

const getClientAppointmentsSchema = z.object({
  clientId: z.string().min(1, "El ID del cliente es obligatorio"),
  shopId: z.string().min(1, "El ID de la tienda es obligatorio"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(5)
})

export async function getClientAppointments(clientIdRaw: string, shopIdRaw: string, pageRaw: number = 1, limitRaw: number = 5) {
  try {
    const validated = getClientAppointmentsSchema.safeParse({ clientId: clientIdRaw, shopId: shopIdRaw, page: pageRaw, limit: limitRaw })
    if (!validated.success) throw new Error("Parámetros inválidos")
    const { clientId, shopId, page, limit } = validated.data

    await requireAdmin(shopId)

    const skip = (page - 1) * limit

    const appointments = await prisma.appointment.findMany({
      where: { customerId: clientId, shopId },
      include: {
        staff: { select: { id: true, name: true } },
        services: { select: { id: true, name: true, price: true } },
        service: { select: { id: true, name: true, price: true } },
        notes: {
          include: { author: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { startTime: "desc" },
      skip,
      take: limit
    })

    return { success: true, data: appointments } as const
  } catch (error) {
    console.error("GET_CLIENT_APPOINTMENTS_ERROR:", error)
    return { success: false, error: "Error al obtener citas del cliente" } as const
  }
}

const getClientsSchema = z.object({
  shopId: z.string().min(1, "El ID de la tienda es obligatorio"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  q: z.string().optional()
})

export async function getClients(shopIdRaw: string, pageRaw: number = 1, limitRaw: number = 10, qRaw?: string) {
  try {
    const validated = getClientsSchema.safeParse({ shopId: shopIdRaw, page: pageRaw, limit: limitRaw, q: qRaw })
    if (!validated.success) throw new Error("Parámetros inválidos")
    
    const { shopId, page, limit, q } = validated.data
    const { businessType } = await requireAdmin(shopId)
    const t = getTerminology(businessType as any)
    
    const skip = (page - 1) * limit

    const dbUsers = await prisma.user.findMany({
      where: {
        AND: [
          { memberships: { some: { shopId, role: Role.CUSTOMER } } },
          q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q, mode: 'insensitive' } }] } : {}
        ]
      },
      include: {
        appointmentsAsCustomer: {
          where: { shopId, status: "COMPLETED" },
          include: { 
            services: { select: { price: true } },
            service: { select: { price: true } }
          },
          orderBy: { startTime: "desc" }
        }
      },
      orderBy: { name: "asc" },
      skip,
      take: limit
    }) as any[]

    const clients = dbUsers.map((user: any) => {
      const completedApps = user.appointmentsAsCustomer || []
      const totalVisits = completedApps.length
      
      const totalSpentValue = completedApps.reduce((acc: number, app: any) => {
        return acc + calculateAppointmentPrice(app)
      }, 0)

      const lastVisitDate = completedApps[0]?.startTime
      return {
        id: user.id,
        name: user.name || user.email || `${t.client} sin nombre`,
        phone: user.phone || "Sin teléfono",
        visits: totalVisits,
        totalSpent: new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(totalSpentValue).replace("CRC", "₡"),
        lastVisit: lastVisitDate ? formatLastVisit(new Date(lastVisitDate)) : "Sin visitas"
      }
    })

    return { success: true, data: clients } as const
  } catch (error: any) {
    console.error("GET_CLIENTS_ERROR:", error)
    return { success: false, error: error.message || "Error al obtener clientes" } as const
  }
}


