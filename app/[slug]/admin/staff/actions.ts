"use server"

import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const scheduleSchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().nullable(),
  closeTime: z.string().nullable(),
  isOpen: z.boolean(),
  breaks: z.array(z.object({
    startTime: z.string(),
    endTime: z.string()
  }))
})

const timeOffSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  type: z.string(),
  note: z.string().nullable().optional()
})

export async function updateStaffSchedule(
  shopId: string,
  staffId: string,
  schedules: z.infer<typeof scheduleSchema>[]
) {
  const { user, role, isSuperAdmin } = await requireAdmin(shopId)

  // Permission check: Staff can only edit their own. Owner/Admin can edit anyone.
  const isSelf = user.id === staffId
  const isprivileged = role === "OWNER" || isSuperAdmin

  if (!isSelf && !isprivileged) {
    throw new Error("No tienes permiso para editar este horario")
  }

  // If staff edits, it's PENDING. If owner edits, it's APPROVED.
  const targetStatus = isprivileged ? "APPROVED" : "PENDING"

  // Fetch all existing schedules for this staff/shop once
  const existingSchedules = await prisma.staffSchedule.findMany({
    where: { staffId, shopId }
  })
  
  const existingMap = new Map(existingSchedules.map(s => [s.dayOfWeek, s]))

  // Process each day in a transaction with increased timeout
  await prisma.$transaction(async (tx) => {
    for (const sched of schedules) {
      const existing = existingMap.get(sched.dayOfWeek)

      if (existing) {
        // Update existing
        await tx.staffSchedule.update({
          where: { id: existing.id },
          data: {
            openTime: sched.openTime,
            closeTime: sched.closeTime,
            isOpen: sched.isOpen,
            status: targetStatus,
            breaks: {
              deleteMany: {},
              create: sched.breaks.map(b => ({
                startTime: b.startTime,
                endTime: b.endTime
              }))
            }
          }
        })
      } else {
        // Create new
        await tx.staffSchedule.create({
          data: {
            staffId,
            shopId,
            dayOfWeek: sched.dayOfWeek,
            openTime: sched.openTime,
            closeTime: sched.closeTime,
            isOpen: sched.isOpen,
            status: targetStatus,
            breaks: {
              create: sched.breaks.map(b => ({
                startTime: b.startTime,
                endTime: b.endTime
              }))
            }
          }
        })
      }
    }
  }, {
    timeout: 15000 // 15 seconds safety margin
  })

  revalidatePath(`/${shopId}/admin/staff`)
  return { success: true }
}

export async function addStaffTimeOff(
  shopId: string,
  staffId: string,
  data: z.infer<typeof timeOffSchema>
) {
  const { user, role, isSuperAdmin } = await requireAdmin(shopId)

  const isSelf = user.id === staffId
  const isprivileged = role === "OWNER" || isSuperAdmin

  if (!isSelf && !isprivileged) {
    throw new Error("No tienes permiso para solicitar tiempo libre")
  }

  const targetStatus = isprivileged ? "APPROVED" : "PENDING"

  await prisma.staffTimeOff.create({
    data: {
      staffId,
      shopId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
      note: data.note,
      status: targetStatus
    }
  })

  revalidatePath(`/${shopId}/admin/staff`)
  return { success: true }
}

/**
 * Owner-only: Get all pending requests for the shop
 */
export async function getPendingRequests(shopId: string) {
  const { role, isSuperAdmin } = await requireAdmin(shopId)
  
  if (role !== "OWNER" && !isSuperAdmin) {
    return { schedules: [], timeOff: [] }
  }

  const [pendingSchedules, pendingTimeOff] = await Promise.all([
    prisma.staffSchedule.findMany({
      where: { shopId, status: "PENDING" },
      include: { staff: true, breaks: true }
    }),
    prisma.staffTimeOff.findMany({
      where: { shopId, status: "PENDING" },
      include: { staff: true }
    })
  ])

  return {
    schedules: pendingSchedules,
    timeOff: pendingTimeOff
  }
}

/**
 * Owner-only: Approve or Reject a request
 */
export async function processRequest(
  shopId: string,
  type: "SCHEDULE" | "TIMEOFF",
  id: string,
  action: "APPROVE" | "REJECT"
) {
  const { role, isSuperAdmin } = await requireAdmin(shopId)
  
  if (role !== "OWNER" && !isSuperAdmin) {
    throw new Error("No tienes permiso")
  }

  const targetStatus = action === "APPROVE" ? "APPROVED" : "REJECTED"

  if (type === "SCHEDULE") {
    await prisma.staffSchedule.update({
      where: { id },
      data: { status: targetStatus }
    })
  } else {
    await prisma.staffTimeOff.update({
      where: { id },
      data: { status: targetStatus }
    })
  }

  revalidatePath(`/${shopId}/admin/staff`)
  return { success: true }
}

export async function getStaffScheduleContext(shopId: string, staffId: string) {
  const [schedules, timeOff] = await Promise.all([
    prisma.staffSchedule.findMany({
      where: { shopId, staffId },
      include: { breaks: true }
    }),
    prisma.staffTimeOff.findMany({
      where: { 
        shopId, 
        staffId,
        endDate: { gte: new Date() } // Only current/future
      },
      orderBy: { startDate: "asc" }
    })
  ])

  return { schedules, timeOff }
}
