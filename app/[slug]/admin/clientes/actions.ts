"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido").optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "OWNER", "STAFF", "CUSTOMER"]),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
  shopId: z.string().min(1, "El ID de la tienda es obligatorio"),
  serviceIds: z.string().optional(), // JSON array string for FormData transport
})

export async function createUser(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    password: formData.get("password"),
    shopId: formData.get("shopId"),
    serviceIds: formData.get("serviceIds"),
  }

  const validated = userSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const { name, email, phone, role, password: rawPassword, shopId: targetShopId, serviceIds: serviceIdsRaw } = validated.data
  const password = rawPassword || "Bookia123!"

  // Parse serviceIds from JSON string (FormData transport)
  const serviceIds: string[] = serviceIdsRaw ? JSON.parse(serviceIdsRaw) : []

  // Validate: STAFF/OWNER must have service selection (even if empty = "Ninguno")
  if ((role === "STAFF" || role === "OWNER") && serviceIdsRaw === undefined) {
    return { success: false, error: "Debes seleccionar al menos un servicio (o 'Ninguno')" }
  }

  try {
    // SECURITY FIX: Mandatory targetShopId validation
    const { role: currentUserRole, isSuperAdmin } = await requireAdmin(targetShopId)

    if (currentUserRole === "STAFF") {
      if (role !== "CUSTOMER") throw new Error("Personal solo puede crear clientes")
    } else if (currentUserRole === "OWNER") {
      if (role !== "STAFF" && role !== "CUSTOMER") throw new Error("Dueños solo pueden crear personal y clientes")
    } else if (!isSuperAdmin) {
      throw new Error("No autorizado para esta tienda")
    }

    if (role === "SUPER_ADMIN" && !isSuperAdmin) throw new Error("Solo los Super Admins pueden crear otros Super Admins")

    const supabaseAdmin = createServiceRoleClient()

    // 1. Check/Create in Supabase Auth using Service Role
    let { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    })

    // If user already exists in Auth, we might want to just link them if they are not in our DB
    if (authError && authError.message.includes("already registered")) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find((u: any) => u.email === email)
      if (existingUser) {
        authData = { user: existingUser } as any
      } else {
        throw new Error("El usuario ya existe en Auth pero no se pudo recuperar")
      }
    } else if (authError) {
      throw new Error(authError.message)
    }

    const authUser = authData?.user
    if (!authUser) throw new Error("Error al crear el usuario en Auth")

    // 2. Create or Update in Prisma using the Auth UUID
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        id: authUser.id,
        name,
        phone,
        needsPasswordChange: true 
      },
      create: {
        id: authUser.id,
        email,
        name,
        phone,
        needsPasswordChange: true
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
      await prisma.user.update({
        where: { id: user.id },
        data: {
          staffServices: {
            set: serviceIds.map(id => ({ id }))
          }
        }
      })
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    console.error("CREATE_USER_ERROR:", error)
    return { success: false, error: error.message || "Error al crear el usuario" }
  }
}

export async function getShopServices(shopId: string) {
  try {
    await requireAdmin(shopId)
    const services = await prisma.service.findMany({
      where: { shopId },
      select: { id: true, name: true, duration: true },
      orderBy: { name: "asc" }
    })
    return { success: true, data: services }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getClientDetails(clientId: string, shopId: string) {
  try {
    const { isSuperAdmin } = await requireAdmin(shopId)

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        appointmentsAsCustomer: {
          where: { shopId }, // Always scoped to shopId as per user request
          include: {
            staff: { select: { name: true } },
            services: { select: { name: true, price: true } },
            service: { select: { name: true, price: true } } // Legacy support
          },
          orderBy: { startTime: "desc" }
        }
      }
    })

    if (!client) return { success: false, error: "Cliente no encontrado" }

    return { success: true, data: client }
  } catch (error) {
    console.error("GET_CLIENT_DETAILS_ERROR:", error)
    return { success: false, error: "Error al obtener detalles del cliente" }
  }
}

