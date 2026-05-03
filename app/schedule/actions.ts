"use server"

import prisma from "@/lib/prisma"
import { getAvailableSlots, checkStaffConflict } from "@/lib/availability"
import { createClient } from "@/lib/supabase/server"
import { combineDateAndTime } from "@/lib/date-utils"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { AppointmentStatus } from "@prisma/client"

const bookingSchema = z.object({
  shopId: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1),
  staffId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(2),
  customerPhone: z.string().optional(),
  customerId: z.string().optional(),
  isAdminBooking: z.boolean().optional(),
})

const querySchema = z.object({
  shopId: z.string().min(1),
  staffId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  serviceIds: z.array(z.string().min(1)).optional(),
  excludeAppointmentId: z.string().optional(),
})

const addNoteSchema = z.object({
  appointmentId: z.string().min(1),
  content: z.string().min(1).max(2000),
  shopId: z.string().min(1),
})

const deleteNoteSchema = z.object({
  noteId: z.string().min(1),
  shopId: z.string().min(1),
})

export async function createBooking(rawData: unknown) {
  const validated = bookingSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: "Datos de reserva inválidos" }
  }

  const { shopId, serviceIds, staffId, date, time, customerName, customerPhone, customerId: inputCustomerId, isAdminBooking } = validated.data

  // 1. Get services to calculate end time and capture total price
  // SECURITY FIX: Mandatory shopId filter to prevent cross-tenant service selection
  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds },
      shopId: shopId
    }
  })

  if (services.length !== serviceIds.length) {
    return { success: false, error: "Uno o más servicios no son válidos para esta tienda" }
  }

  const totalDuration = services.reduce((acc, s) => acc + s.duration, 0)
  const totalPrice = services.reduce((acc, s) => acc + s.price, 0)

  // 2. Calculate start and end times
  const startTime = combineDateAndTime(date, time)
  const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)

  // 3. Resolve staff (if "auto", find the first available)
  let resolvedStaffId: string | null = null

  if (staffId === "auto") {
    const staffMembers = await prisma.shopMember.findMany({
      where: { shopId, role: { in: ["STAFF", "OWNER"] } },
      select: { userId: true }
    })

    // Shuffle staff members randomly (Fisher-Yates)
    for (let i = staffMembers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [staffMembers[i], staffMembers[j]] = [staffMembers[j], staffMembers[i]];
    }

    for (const member of staffMembers) {
      const hasConflict = await checkStaffConflict(shopId, member.userId, startTime, endTime)
      if (!hasConflict) {
        resolvedStaffId = member.userId
        break
      }
    }

    if (!resolvedStaffId) {
      return { success: false, error: "No hay disponibilidad para este horario" }
    }
  } else {
    // Validate the specific staff is still available
    const hasConflict = await checkStaffConflict(shopId, staffId, startTime, endTime)

    if (hasConflict) {
      return { success: false, error: "Este horario ya fue reservado" }
    }

    resolvedStaffId = staffId
  }

  // 4. Find or create customer by session or phone
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let customerId: string | null = null

  if (isAdminBooking) {
    // SECURITY: Validate that the request maker is an admin of the shop
    if (!authUser) {
      return { success: false, error: "Debes iniciar sesión" }
    }

    // Check 1: JWT app_metadata claim (set via Supabase Admin API)
    const globalRoleFromJwt = authUser.app_metadata?.role as string | undefined

    // Check 2: DB membership fallback (same logic used in requireAdmin/getAdminUser)
    const membership = await prisma.shopMember.findUnique({
      where: { userId_shopId: { userId: authUser.id, shopId } }
    })

    const isSuperAdmin =
      globalRoleFromJwt === "SUPER_ADMIN" || membership?.role === "SUPER_ADMIN"

    const isAuthorized =
      isSuperAdmin || (membership && ["OWNER", "STAFF"].includes(membership.role))

    if (!isAuthorized) {
      return { success: false, error: "No tienes permisos de administrador para esta tienda" }
    }

    // Trust the provided customerId or leave it null (unregistered client created by admin)
    customerId = inputCustomerId || null
  } else {
    // SECURITY: If authenticated, must have verified email
    if (authUser && !authUser.email_confirmed_at) {
      return {
        success: false,
        error: "Por favor, confirma tu correo electrónico antes de realizar una reserva."
      }
    }

    customerId = authUser?.id || null

    if (!customerId && customerPhone) {
      const existingUser = await prisma.user.findFirst({
        where: { phone: customerPhone }
      })

      if (existingUser) {
        customerId = existingUser.id
        // Update name if it was missing
        if (!existingUser.name && customerName) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { name: customerName }
          })
        }
      }
    }
  }

  // 5. Create the appointment
  const appointment = await prisma.appointment.create({
    data: {
      shopId,
      serviceId: serviceIds[0], // Keep for backward compatibility
      services: {
        connect: serviceIds.map(id => ({ id }))
      },
      staffId: resolvedStaffId,
      customerId,
      startTime,
      endTime,
      priceAtBooking: totalPrice,
      customerName,
      customerPhone,
      status: "CONFIRMED",
      isNotified: isAdminBooking ?? false,
      serviceDetails: services.map(s => ({ id: s.id, name: s.name, price: s.price }))
    }
  })

  return { success: true, appointmentId: appointment.id }
}

export async function fetchAvailableSlots(
  shopId: string,
  staffId: string,
  dateStr: string,
  excludeAppointmentId?: string
): Promise<string[]> {
  const validated = querySchema.safeParse({ shopId, staffId, date: dateStr, excludeAppointmentId })
  if (!validated.success) return []

  return getAvailableSlots(shopId, staffId, dateStr, excludeAppointmentId)
}

export async function getAvailableStaffForSlot(
  shopId: string,
  date: string,
  time: string,
  serviceIds: string[]
): Promise<{ id: string; name: string }[]> {
  const validated = querySchema.safeParse({ shopId, date, time, serviceIds })
  if (!validated.success) return []

  // 1. Get services to calculate total duration
  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds },
      shopId: shopId
    }
  })
  if (services.length === 0) return []

  const totalDuration = services.reduce((acc, s) => acc + s.duration, 0)
  const startTime = combineDateAndTime(date, time)
  const endTime = new Date(startTime.getTime() + totalDuration * 60000)

  // 2. Fetch all shop members and their schedules in a single query
  const dayOfWeek = startTime.getDay()
  const staffMembers = await prisma.shopMember.findMany({
    where: { shopId, role: { in: ["STAFF", "OWNER"] } },
    include: {
      user: {
        include: {
          staffSchedules: {
            where: { shopId, dayOfWeek }
          }
        }
      }
    } as any
  })

  // 3. PERFORMANCE OPTIMIZATION: Fetch ALL appointments for this shop on this day once
  const dayStart = combineDateAndTime(date, "00:00")
  const dayEnd = combineDateAndTime(date, "23:59")
  const allAppointments = await prisma.appointment.findMany({
    where: {
      shopId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { not: "CANCELLED" }
    },
    select: { staffId: true, startTime: true, endTime: true }
  })

  const availableStaff = []
  for (const member of (staffMembers as any)) {
    const staffId = member.userId
    const staffSchedule = member.user.staffSchedules[0]

    // OFF-DUTY LOGIC: If a staff schedule exists and it's closed, they are off-duty
    if (staffSchedule && !staffSchedule.isOpen) continue

    // Check if appointment overlaps with any of this staff's existing appointments
    const hasConflict = allAppointments.some(app =>
      app.staffId === staffId &&
      startTime < app.endTime &&
      endTime > app.startTime
    )

    if (!hasConflict) {
      availableStaff.push({ id: staffId, name: member.user.name || "Sin nombre" })
    }
  }

  return availableStaff
}

async function validateAdminSession(shopId: string) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return { success: false as const, error: "Debes iniciar sesión" }

  const membership = await prisma.shopMember.findUnique({
    where: { userId_shopId: { userId: authUser.id, shopId } }
  })

  const isSuperAdmin = authUser.app_metadata?.role === "SUPER_ADMIN" || membership?.role === "SUPER_ADMIN"
  const isAuthorized = isSuperAdmin || (membership && ["OWNER", "STAFF"].includes(membership.role))

  if (!isAuthorized) return { success: false as const, error: "No tienes permisos" }

  return { success: true as const, user: authUser, membership }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  shopId: string
) {
  // 1. SECURITY: Require admin session for this shop
  const auth = await validateAdminSession(shopId)
  if (!auth.success) return { success: false, error: auth.error }

  // 2. Perform the update
  try {
    await prisma.appointment.update({
      where: {
        id: appointmentId,
        shopId // Extra security: ensure the appointment belongs to the reported shop
      },
      data: { status }
    })

    // 3. Revalidate relevant paths
    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } })
    if (shop) {
      revalidatePath(`/${shop.slug}/admin/citas`)
      revalidatePath(`/${shop.slug}/admin`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating appointment status:", error)
    return { success: false, error: "Error al actualizar el estado de la cita" }
  }
}

export async function updateBooking(rawData: unknown) {
  const updateSchema = z.object({
    appointmentId: z.string().min(1),
    shopId: z.string().min(1),
    serviceIds: z.array(z.string().min(1)).min(1),
    staffId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    status: z.nativeEnum(AppointmentStatus).optional(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
  })

  const validated = updateSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: "Datos de actualización inválidos" }
  }

  const { appointmentId, shopId, serviceIds, staffId, date, time, status, customerName, customerPhone } = validated.data

  // 1. SECURITY: Validate admin rights
  const auth = await validateAdminSession(shopId)
  if (!auth.success) return { success: false, error: auth.error }

  // 2. Validate services
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, shopId }
  })
  if (services.length !== serviceIds.length) {
    return { success: false, error: "Servicios inválidos" }
  }

  const existingAppointment = await prisma.appointment.findUnique({
    where: { id: appointmentId, shopId },
    include: { services: true }
  })
  if (!existingAppointment) {
    return { success: false, error: "Cita no encontrada" }
  }

  const existingServiceIds = existingAppointment.services.map(s => s.id).sort()
  const newServiceIds = [...serviceIds].sort()
  const hasServicesChanged = JSON.stringify(existingServiceIds) !== JSON.stringify(newServiceIds)

  const totalDuration = services.reduce((acc, s) => acc + s.duration, 0)
  const startTime = combineDateAndTime(date, time)
  const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)

  // 3. Check Conflict
  const hasConflict = await checkStaffConflict(shopId, staffId, startTime, endTime, appointmentId)
  if (hasConflict) {
    return { success: false, error: "Este horario ya está ocupado por otra cita" }
  }

  // 4. Update
  try {
    const hasStaffChanged = existingAppointment.staffId !== staffId
    // --- Intelligent Snapshot Merging ---
    const oldDetails = (existingAppointment.serviceDetails as any[]) || []
    const finalServiceDetails = services.map(s => {
      // If the service was already in the appointment, keep its historical details
      const existingDetail = oldDetails.find(d => d.id === s.id)
      if (existingDetail) return existingDetail
      
      // If it's a brand new service being added, use current price snapshot
      return { id: s.id, name: s.name, price: s.price }
    })

    const finalPriceAtBooking = finalServiceDetails.reduce((acc, s) => acc + s.price, 0)

    await prisma.appointment.update({
      where: { id: appointmentId, shopId },
      data: {
        staffId,
        startTime,
        endTime,
        status,
        priceAtBooking: finalPriceAtBooking,
        customerName,
        customerPhone,
        isNotified: hasStaffChanged ? false : existingAppointment.isNotified,
        serviceId: serviceIds[0], // backward compat
        services: {
          set: [], // Clear existing relations
          connect: serviceIds.map(id => ({ id }))
        },
        serviceDetails: finalServiceDetails
      }
    })

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } })
    if (shop) {
      revalidatePath(`/${shop.slug}/admin`)
      revalidatePath(`/${shop.slug}/admin/citas`)
    }
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al actualizar la cita" }
  }
}

export async function addAppointmentNote(
  rawData: unknown
) {
  const validated = addNoteSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: "Datos de nota inválidos" }
  }

  const { appointmentId, content, shopId } = validated.data

  // 1. SECURITY: Validate admin rights
  const auth = await validateAdminSession(shopId)
  if (!auth.success) return { success: false, error: auth.error }
  const { user: authUser } = auth

  // 1.1 SECURITY: Ensure the appointment belongs to this shop
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId, shopId }
  })
  if (!appointment) return { success: false, error: "Cita no encontrada" }

  if (!content.trim()) return { success: false, error: "La nota no puede estar vacía" }

  // 1.5 SELF-HEALING: Ensure user has a name in Prisma if available in Supabase metadata
  const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name
  if (fullName) {
    try {
      await prisma.user.updateMany({
        where: { id: authUser.id, OR: [{ name: null }, { name: "" }] },
        data: { name: fullName }
      })
    } catch (e) {
      console.error("Failed to self-heal user name:", e)
    }
  }

  // 2. Create Note
  try {
    await prisma.appointmentNote.create({
      data: {
        appointmentId,
        authorId: authUser.id,
        content: content.trim()
      }
    })

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } })
    if (shop) {
      revalidatePath(`/${shop.slug}/admin/citas`)
    }
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al crear la nota" }
  }
}

export async function deleteAppointmentNote(
  rawData: unknown
) {
  const validated = deleteNoteSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: "Datos de eliminación inválidos" }
  }

  const { noteId, shopId } = validated.data

  // 1. SECURITY: Validate admin rights
  const auth = await validateAdminSession(shopId)
  if (!auth.success) return { success: false, error: auth.error }

  // 2. Delete Note
  try {
    // Security: ensure the note belongs to an appointment in this shop
    const note = await prisma.appointmentNote.findUnique({
      where: { id: noteId },
      include: { appointment: true }
    })

    if (!note || note.appointment.shopId !== shopId) {
      return { success: false, error: "Nota no encontrada o no autorizada" }
    }

    await prisma.appointmentNote.delete({
      where: { id: noteId }
    })

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } })
    if (shop) {
      revalidatePath(`/${shop.slug}/admin/citas`)
    }
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al eliminar la nota" }
  }
}
