

import prisma from "@/lib/prisma"
import { z } from "zod"
import { combineDateAndTime, toCRDate } from "@/lib/date-utils"

export async function checkStaffConflict(
  shopId: string,
  staffId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const validated = z.object({
    shopId: z.string().min(1),
    staffId: z.string().min(1),
  }).safeParse({ shopId, staffId })
  
  if (!validated.success) return true // Treat as conflict if invalid

  const conflict = await prisma.appointment.findFirst({
    where: {
      shopId,
      staffId,
      status: { not: "CANCELLED" },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {})
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
  dateStr: string,
  excludeAppointmentId?: string
): Promise<string[]> {
  const [year, month, day] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()

  const schedule = await prisma.shopSchedule.findUnique({
    where: { shopId_dayOfWeek: { shopId, dayOfWeek } }
  })

  // FALLBACK: If no shop schedule exists, use standard business hours (08:00 - 20:00)
  const effectiveSchedule = schedule || {
    openTime: "08:00",
    closeTime: "20:00",
    slotDuration: 30,
    isOpen: true
  }

  if (!effectiveSchedule.isOpen) return []

  // Ensure we do not consider past times for today
  // We use America/Costa_Rica as the system time zone reference
  const crNow = toCRDate(new Date())
  const isToday = 
    crNow.getFullYear() === date.getFullYear() &&
    crNow.getMonth() === date.getMonth() &&
    crNow.getDate() === date.getDate()

  const allSlots = generateSlots(effectiveSchedule.openTime, effectiveSchedule.closeTime, effectiveSchedule.slotDuration)
  const dayStart = combineDateAndTime(dateStr, "00:00")
  const dayEnd = combineDateAndTime(dateStr, "23:59:59")

  // Filter out ALL past slots inherently if today
  let validSlots = allSlots
  if (isToday) {
    const currentMinutes = crNow.getHours() * 60 + crNow.getMinutes()
    validSlots = allSlots.filter(slot => {
      const [h, m] = slot.split(":").map(Number)
      return (h * 60 + m) > currentMinutes
    })
  }

  if (staffId === "auto") {
    const staffMembers = await prisma.shopMember.findMany({
      where: { shopId, role: { in: ["STAFF", "OWNER"] } },
      include: { 
        user: { 
          include: { 
            staffSchedules: { 
              where: { shopId, dayOfWeek, status: { in: ["APPROVED", "PENDING"] } },
              include: { breaks: true }
            },
            staffTimeOff: {
              where: { 
                shopId, 
                status: "APPROVED",
                startDate: { lte: dayEnd },
                endDate: { gte: dayStart }
              }
            }
          } 
        } 
      } as any
    })

    const appointments = await prisma.appointment.findMany({
      where: {
        shopId,
        staffId: { in: staffMembers.map(s => s.userId) },
        startTime: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {})
      },
      select: { staffId: true, startTime: true, endTime: true }
    })

    return validSlots.filter((slot: string) => {
      const slotStart = combineDateAndTime(dateStr, slot)
      const slotEnd = new Date(slotStart.getTime() + effectiveSchedule.slotDuration * 60000)

      return staffMembers.some((member: any) => {
        const individualSchedule = member.user.staffSchedules[0]
        const timeOff = member.user.staffTimeOff

        // 1. Check Vacation/Time Off
        const hasTimeOff = timeOff.some((to: any) => {
          const toStart = to.startTime ? combineDateAndTime(dateStr, to.startTime) : dayStart
          const toEnd = to.endTime ? combineDateAndTime(dateStr, to.endTime) : dayEnd
          return slotStart < toEnd && slotEnd > toStart
        })
        if (hasTimeOff) return false

        // 2. Check Custom Working Hours (if Approved schedule exists)
        if (individualSchedule) {
          if (!individualSchedule.isOpen) return false
          
          // Check breaks
          const inBreak = individualSchedule.breaks.some((b: any) => {
            const bStart = combineDateAndTime(dateStr, b.startTime)
            const bEnd = combineDateAndTime(dateStr, b.endTime)
            return slotStart < bEnd && slotEnd > bStart
          })
          if (inBreak) return false

          // Check custom open/close
          if (individualSchedule.openTime || individualSchedule.closeTime) {
            const sOpen = individualSchedule.openTime ? combineDateAndTime(dateStr, individualSchedule.openTime) : dayStart
            const sClose = individualSchedule.closeTime ? combineDateAndTime(dateStr, individualSchedule.closeTime) : dayEnd
            if (slotStart < sOpen || slotEnd > sClose) return false
          }
        }

        // 3. Check Conflict with Appointments
        const hasConflict = appointments.some((app: any) =>
          app.staffId === member.userId &&
          slotStart < app.endTime &&
          slotEnd > app.startTime
        )
        return !hasConflict
      })
    })
  } else {
    // Specific staff member check
    const [staffSchedule, staffTimeOff] = await Promise.all([
      prisma.staffSchedule.findFirst({
        where: { staffId, shopId, dayOfWeek, status: { in: ["APPROVED", "PENDING"] } },
        include: { breaks: true }
      }),
      prisma.staffTimeOff.findMany({
        where: { 
          staffId, 
          shopId, 
          status: "APPROVED",
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart }
        }
      })
    ])

    const appointments = await prisma.appointment.findMany({
      where: {
        shopId,
        staffId,
        startTime: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {})
      },
      select: { startTime: true, endTime: true }
    })

    return validSlots.filter((slot: string) => {
      const slotStart = combineDateAndTime(dateStr, slot)
      const slotEnd = new Date(slotStart.getTime() + effectiveSchedule.slotDuration * 60000)

      // 1. Time off check
      const hasTimeOff = staffTimeOff.some((to: any) => {
        const toStart = to.startTime ? combineDateAndTime(dateStr, to.startTime) : dayStart
        const toEnd = to.endTime ? combineDateAndTime(dateStr, to.endTime) : dayEnd
        return slotStart < toEnd && slotEnd > toStart
      })
      if (hasTimeOff) return false

      // 2. Schedule check
      if (staffSchedule) {
        if (!staffSchedule.isOpen) return false
        const inBreak = staffSchedule.breaks.some((b: any) => {
          const bStart = combineDateAndTime(dateStr, b.startTime)
          const bEnd = combineDateAndTime(dateStr, b.endTime)
          return slotStart < bEnd && slotEnd > bStart
        })
        if (inBreak) return false

        if (staffSchedule.openTime || staffSchedule.closeTime) {
          const sOpen = staffSchedule.openTime ? combineDateAndTime(dateStr, staffSchedule.openTime) : dayStart
          const sClose = staffSchedule.closeTime ? combineDateAndTime(dateStr, staffSchedule.closeTime) : dayEnd
          if (slotStart < sOpen || slotEnd > sClose) return false
        }
      }

      const hasConflict = appointments.some((app: any) =>
        slotStart < app.endTime && slotEnd > app.startTime
      )
      return !hasConflict
    })
  }
}
