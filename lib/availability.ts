

import prisma from "@/lib/prisma"
import { z } from "zod"

export async function checkStaffConflict(
  shopId: string,
  staffId: string,
  startTime: Date,
  endTime: Date
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
  dateStr: string
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

  const allSlots = generateSlots(effectiveSchedule.openTime, effectiveSchedule.closeTime, effectiveSchedule.slotDuration)
  const dayStart = new Date(dateStr + "T00:00:00")
  const dayEnd = new Date(dateStr + "T23:59:59")

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
        status: { not: "CANCELLED" }
      },
      select: { staffId: true, startTime: true, endTime: true }
    })

    return allSlots.filter((slot: string) => {
      const slotStart = new Date(dateStr + `T${slot}:00`)
      const slotEnd = new Date(slotStart.getTime() + effectiveSchedule.slotDuration * 60000)

      return staffMembers.some((member: any) => {
        const individualSchedule = member.user.staffSchedules[0]
        const timeOff = member.user.staffTimeOff

        // 1. Check Vacation/Time Off
        const hasTimeOff = timeOff.some((to: any) => {
          const toStart = to.startTime ? new Date(dateStr + `T${to.startTime}:00`) : dayStart
          const toEnd = to.endTime ? new Date(dateStr + `T${to.endTime}:00`) : dayEnd
          return slotStart < toEnd && slotEnd > toStart
        })
        if (hasTimeOff) return false

        // 2. Check Custom Working Hours (if Approved schedule exists)
        if (individualSchedule) {
          if (!individualSchedule.isOpen) return false
          
          // Check breaks
          const inBreak = individualSchedule.breaks.some((b: any) => {
            const bStart = new Date(dateStr + `T${b.startTime}:00`)
            const bEnd = new Date(dateStr + `T${b.endTime}:00`)
            return slotStart < bEnd && slotEnd > bStart
          })
          if (inBreak) return false

          // Check custom open/close
          if (individualSchedule.openTime || individualSchedule.closeTime) {
            const sOpen = individualSchedule.openTime ? new Date(dateStr + `T${individualSchedule.openTime}:00`) : dayStart
            const sClose = individualSchedule.closeTime ? new Date(dateStr + `T${individualSchedule.closeTime}:00`) : dayEnd
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
        status: { not: "CANCELLED" }
      },
      select: { startTime: true, endTime: true }
    })

    return allSlots.filter((slot: string) => {
      const slotStart = new Date(dateStr + `T${slot}:00`)
      const slotEnd = new Date(slotStart.getTime() + effectiveSchedule.slotDuration * 60000)

      // 1. Time off check
      const hasTimeOff = staffTimeOff.some((to: any) => {
        const toStart = to.startTime ? new Date(dateStr + `T${to.startTime}:00`) : dayStart
        const toEnd = to.endTime ? new Date(dateStr + `T${to.endTime}:00`) : dayEnd
        return slotStart < toEnd && slotEnd > toStart
      })
      if (hasTimeOff) return false

      // 2. Schedule check
      if (staffSchedule) {
        if (!staffSchedule.isOpen) return false
        const inBreak = staffSchedule.breaks.some((b: any) => {
          const bStart = new Date(dateStr + `T${b.startTime}:00`)
          const bEnd = new Date(dateStr + `T${b.endTime}:00`)
          return slotStart < bEnd && slotEnd > bStart
        })
        if (inBreak) return false

        if (staffSchedule.openTime || staffSchedule.closeTime) {
          const sOpen = staffSchedule.openTime ? new Date(dateStr + `T${staffSchedule.openTime}:00`) : dayStart
          const sClose = staffSchedule.closeTime ? new Date(dateStr + `T${staffSchedule.closeTime}:00`) : dayEnd
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
