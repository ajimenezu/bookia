"use server"

import prisma from "@/lib/prisma"
import { getAvailableSlots, checkStaffConflict } from "@/lib/availability"
import { z } from "zod"

const bookingSchema = z.object({
  shopId: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1),
  staffId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
})

export async function createBooking(rawData: unknown) {
  const validated = bookingSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: "Datos de reserva inválidos" }
  }

  const { shopId, serviceIds, staffId, date, time, customerName, customerPhone } = validated.data

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

  // 4. Find or create customer by phone
  let customerId: string | null = null
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
  return getAvailableSlots(shopId, staffId, dateStr)
}

export async function getAvailableStaffForSlot(
  shopId: string,
  date: string,
  time: string,
  serviceIds: string[]
): Promise<{ id: string; name: string }[]> {
  // SECURITY FIX: Mandatory shopId filter
  const services = await prisma.service.findMany({ 
    where: { 
      id: { in: serviceIds },
      shopId: shopId
    } 
  })
  if (services.length === 0) return []

  const totalDuration = services.reduce((acc, s) => acc + s.duration, 0)

  const startTime = new Date(`${date}T${time}:00`)
  const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)

  const staffMembers = await prisma.shopMember.findMany({
    where: { shopId, role: { in: ["STAFF", "OWNER"] } },
    include: { user: { select: { id: true, name: true } } }
  })

  const availableStaff = []
  for (const member of staffMembers) {
    const hasConflict = await checkStaffConflict(shopId, member.userId, startTime, endTime)
    if (!hasConflict) {
      availableStaff.push({ id: member.userId, name: member.user.name || "Sin nombre" })
    }
  }

  return availableStaff
}
