

import prisma from "@/lib/prisma"

export async function checkStaffConflict(
  shopId: string,
  staffId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  if (!shopId) {
    throw new Error("shopId is required for checkStaffConflict");
  }

  const conflict = await prisma.appointment.findFirst({
    where: {
      shopId,
      staffId,
      status: { not: "CANCELLED" },
      startTime: { lt: endTime },
      endTime: { gt: startTime }
    }
  })
  return !!conflict;
}


/**
 * Generate time slots between open and close times with a given interval.
 */
function generateSlots(openTime: string, closeTime: string, slotDuration: number): string[] {
  const slots: string[] = []
  const [openH, openM] = openTime.split(":").map(Number)
  const [closeH, closeM] = closeTime.split(":").map(Number)

  let currentMinutes = openH * 60 + openM
  const endMinutes = closeH * 60 + closeM

  while (currentMinutes + slotDuration <= endMinutes) {
    const h = Math.floor(currentMinutes / 60)
    const m = currentMinutes % 60
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
    currentMinutes += slotDuration
  }

  return slots
}

/**
 * Get available time slots for a specific staff member on a specific date.
 * If staffId is "auto", returns slots where at least one staff member is available.
 */
export async function getAvailableSlots(
  shopId: string,
  staffId: string,
  dateStr: string // ISO date string "2026-03-20"
): Promise<string[]> {
  const [year, month, day] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay() // 0=Sunday

  // 1. Get shop schedule for this day
  // @ts-ignore
  const schedule = await prisma.shopSchedule.findUnique({
    where: { shopId_dayOfWeek: { shopId, dayOfWeek } }
  })

  if (!schedule || !schedule.isOpen) {
    return [] // Shop is closed this day
  }

  // 2. Generate all possible slots
  const allSlots = generateSlots(schedule.openTime, schedule.closeTime, schedule.slotDuration)

  // 3. Get start/end of the selected day for querying appointments
  const dayStart = new Date(dateStr + "T00:00:00")
  const dayEnd = new Date(dateStr + "T23:59:59")

  if (staffId === "auto") {
    // Get all staff for this shop
    const staffMembers = await prisma.shopMember.findMany({
      where: { shopId, role: { in: ["STAFF", "OWNER"] } },
      select: { userId: true }
    })

    // Get all appointments for all staff on this date
    const appointments = await prisma.appointment.findMany({
      where: {
        shopId,
        staffId: { in: staffMembers.map((s: any) => s.userId) },
        startTime: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" }
      },
      select: { staffId: true, startTime: true, endTime: true }
    })

    // A slot is available if at least one staff member is free
    return allSlots.filter((slot: string) => {
      const slotStart = new Date(dateStr + `T${slot}:00`)
      const slotEnd = new Date(slotStart.getTime() + schedule.slotDuration * 60000)

      return staffMembers.some((staff: any) => {
        // Check if this staff member has a conflicting appointment
        const hasConflict = appointments.some((app: any) =>
          app.staffId === staff.userId &&
          slotStart < app.endTime &&
          slotEnd > app.startTime
        )
        return !hasConflict
      })
    })
  } else {
    // Specific staff member
    const appointments = await prisma.appointment.findMany({
      where: {
        shopId,
        staffId,
        startTime: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" }
      },
      select: { startTime: true, endTime: true }
    })

    return allSlots.filter((slot: string) => {
      const slotStart = new Date(dateStr + `T${slot}:00`)
      const slotEnd = new Date(slotStart.getTime() + schedule.slotDuration * 60000)

      const hasConflict = appointments.some((app: any) =>
        slotStart < app.endTime && slotEnd > app.startTime
      )
      return !hasConflict
    })
  }
}
