"use server"

import prisma from "@/lib/prisma"
import { getAvailableSlots, checkStaffConflict } from "@/lib/availability"

interface CreateBookingData {
  shopId: string
  serviceIds: string[]
  staffId: string // "auto" or actual userId
  date: string    // "2026-03-20"
  time: string    // "09:00"
  customerName: string
  customerPhone: string
}

export async function createBooking(data: CreateBookingData) {
  const { shopId, serviceIds, staffId, date, time, customerName, customerPhone } = data

  // 1. Get services to calculate end time and capture total price
  const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } })
  if (services.length === 0) {
    return { success: false, error: "Servicio no encontrado" }
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
      const hasConflict = await checkStaffConflict(member.userId, startTime, endTime)
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
    const hasConflict = await checkStaffConflict(staffId, startTime, endTime)

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
  const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } })
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
    const hasConflict = await checkStaffConflict(member.userId, startTime, endTime)
    if (!hasConflict) {
      availableStaff.push({ id: member.userId, name: member.user.name || "Sin nombre" })
    }
  }

  return availableStaff
}
