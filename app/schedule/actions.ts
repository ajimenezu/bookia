"use server"

import prisma from "@/lib/prisma"
import { getAvailableSlots, checkStaffConflict } from "@/lib/availability"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

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
  const startTime = new Date(`${date}T${time}:00`)
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
      status: "CONFIRMED"
    }
  })

  return { success: true, appointmentId: appointment.id }
}

export async function fetchAvailableSlots(
  shopId: string,
  staffId: string,
  dateStr: string
): Promise<string[]> {
  const validated = querySchema.safeParse({ shopId, staffId, date: dateStr })
  if (!validated.success) return []

  return getAvailableSlots(shopId, staffId, dateStr)
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
  const startTime = new Date(`${date}T${time}:00`)
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
  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59`)
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
