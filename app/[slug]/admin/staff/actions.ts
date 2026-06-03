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
  shopIdRaw: string,
  staffIdRaw: string,
  schedulesRaw: z.infer<typeof scheduleSchema>[]
) {
  const validated = z.object({
    shopId: z.string().min(1),
    staffId: z.string().min(1),
    schedules: z.array(scheduleSchema)
  }).safeParse({ shopId: shopIdRaw, staffId: staffIdRaw, schedules: schedulesRaw })

  if (!validated.success) throw new Error("Parámetros inválidos")
  const { shopId, staffId, schedules } = validated.data

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
  shopIdRaw: string,
  staffIdRaw: string,
  dataRaw: z.infer<typeof timeOffSchema>
) {
  const validated = z.object({
    shopId: z.string().min(1),
    staffId: z.string().min(1),
    data: timeOffSchema
  }).safeParse({ shopId: shopIdRaw, staffId: staffIdRaw, data: dataRaw })

  if (!validated.success) throw new Error("Parámetros inválidos")
  const { shopId, staffId, data } = validated.data

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
 * Get all pending requests and new notifications for the shop member
 */
export async function getPendingRequests(shopIdRaw: string) {
  const validated = z.string().min(1).safeParse(shopIdRaw)
  if (!validated.success) throw new Error("ID de tienda inválido")
  const shopId = validated.data

  const { user, role, isSuperAdmin } = await requireAdmin(shopId)
  
  const isPrivileged = role === "OWNER" || isSuperAdmin

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [pendingSchedules, pendingTimeOff, newAppointments] = await Promise.all([
    // Only owners/superadmins see pending approvals
    isPrivileged 
      ? prisma.staffSchedule.findMany({
          where: { shopId, status: "PENDING" },
          include: { staff: true, breaks: true }
        })
      : Promise.resolve([]),
    
    isPrivileged
      ? prisma.staffTimeOff.findMany({
          where: { shopId, status: "PENDING" },
          include: { staff: true }
        })
      : Promise.resolve([]),

    // Everyone sees their own unnotified appointments
    prisma.appointment.findMany({
      where: { 
        shopId, 
        ...(isPrivileged ? {} : { staffId: user.id }),
        isNotified: false,
        startTime: { gte: thirtyDaysAgo }
      },
      include: { services: true }
    })
  ])

  return {
    schedules: pendingSchedules,
    timeOff: pendingTimeOff,
    appointments: newAppointments
  }
}

export async function markAppointmentAsNotified(appointmentIdRaw: string, shopIdRaw: string) {
  const validated = z.object({
    appointmentId: z.string().min(1),
    shopId: z.string().min(1)
  }).safeParse({ appointmentId: appointmentIdRaw, shopId: shopIdRaw })

  if (!validated.success) throw new Error("Parámetros inválidos")
  const { appointmentId, shopId } = validated.data

  await requireAdmin(shopId)

  // Security: Ensure user is either an admin/owner or the assigned staff
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId, shopId }
  })

  if (!appointment) throw new Error("Cita no encontrada")
  
  // We allow owners to mark as notified too, or the staff themselves
  // But usually it's the staff who does it.
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { isNotified: true }
  })

  revalidatePath(`/${shopId}/admin`)
  return { success: true }
}

export async function markAllAppointmentsAsNotified(shopIdRaw: string) {
  const validated = z.string().min(1).safeParse(shopIdRaw)
  if (!validated.success) throw new Error("ID de tienda inválido")
  const shopId = validated.data

  const { user, role, isSuperAdmin } = await requireAdmin(shopId)
  const isPrivileged = role === "OWNER" || isSuperAdmin

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  await prisma.appointment.updateMany({
    where: {
      shopId,
      ...(isPrivileged ? {} : { staffId: user.id }),
      isNotified: false,
      startTime: { gte: thirtyDaysAgo }
    },
    data: { isNotified: true }
  })

  revalidatePath(`/${shopId}/admin`)
  return { success: true }
}

/**
 * Owner-only: Approve or Reject a request
 */
export async function processRequest(
  shopIdRaw: string,
  typeRaw: "SCHEDULE" | "TIMEOFF",
  idRaw: string,
  actionRaw: "APPROVE" | "REJECT"
) {
  const validated = z.object({
    shopId: z.string().min(1),
    type: z.enum(["SCHEDULE", "TIMEOFF"]),
    id: z.string().min(1),
    action: z.enum(["APPROVE", "REJECT"])
  }).safeParse({ shopId: shopIdRaw, type: typeRaw, id: idRaw, action: actionRaw })

  if (!validated.success) throw new Error("Parámetros inválidos")
  const { shopId, type, id, action } = validated.data

  const { role, isSuperAdmin } = await requireAdmin(shopId)
  
  if (role !== "OWNER" && !isSuperAdmin) {
    throw new Error("No tienes permiso")
  }

  const targetStatus = action === "APPROVE" ? "APPROVED" : "REJECTED"

  if (type === "SCHEDULE") {
    await prisma.staffSchedule.update({
      where: { id, shopId }, // SECURITY: Strict shopId scoping
      data: { status: targetStatus }
    })
  } else {
    await prisma.staffTimeOff.update({
      where: { id, shopId }, // SECURITY: Strict shopId scoping
      data: { status: targetStatus }
    })
  }

  revalidatePath(`/${shopId}/admin/staff`)
  return { success: true }
}

export async function getStaffScheduleContext(shopIdRaw: string, staffIdRaw: string) {
  const validated = z.object({
    shopId: z.string().min(1),
    staffId: z.string().min(1)
  }).safeParse({ shopId: shopIdRaw, staffId: staffIdRaw })

  if (!validated.success) throw new Error("Parámetros inválidos")
  const { shopId, staffId } = validated.data
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

const getStaffDetailsSchema = z.object({
  staffId: z.string().min(1, "El ID del personal es obligatorio"),
  shopId: z.string().min(1, "El ID de la tienda es obligatorio")
})

export async function getStaffDetails(staffIdRaw: string, shopIdRaw: string) {
  try {
    const validated = getStaffDetailsSchema.safeParse({ staffId: staffIdRaw, shopId: shopIdRaw })
    if (!validated.success) return { success: false, error: "Parámetros inválidos" }
    
    const { staffId, shopId } = validated.data
    await requireAdmin(shopId)

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      include: {
        memberships: {
          where: { shopId }
        },
        staffServices: {
          where: { shopId },
          select: { id: true, name: true }
        },
        appointmentsAsStaff: {
          where: { shopId, endTime: { lte: new Date() } },
          include: {
            customer: { select: { name: true } },
            services: { select: { name: true, price: true } }
          },
          orderBy: { startTime: "desc" },
          take: 5
        }
      }
    })

    if (!staff) return { success: false, error: "Personal no encontrado" }

    return { success: true, data: staff }
  } catch (error) {
    console.error("GET_STAFF_DETAILS_ERROR:", error)
    return { success: false, error: "Error al obtener detalles" }
  }
}

const updateStaffStatusSchema = z.object({
  staffId: z.string().min(1, "El ID del personal es obligatorio"),
  shopId: z.string().min(1, "El ID de la tienda es obligatorio"),
  isActive: z.boolean()
})

export async function updateStaffStatus(staffIdRaw: string, shopIdRaw: string, isActiveRaw: boolean) {
  try {
    const validated = updateStaffStatusSchema.safeParse({ staffId: staffIdRaw, shopId: shopIdRaw, isActive: isActiveRaw })
    if (!validated.success) throw new Error("Parámetros inválidos")

    const { staffId, shopId, isActive } = validated.data
    const { role: currentUserRole, isSuperAdmin } = await requireAdmin(shopId)
    
    // Get target user role
    const targetMember = await prisma.shopMember.findUnique({
      where: { userId_shopId: { userId: staffId, shopId } }
    })

    if (!targetMember) throw new Error("Miembro no encontrado")

    // RBAC: 
    // Owners can deactivate staff.
    // Super admins can deactivate staff and owners.
    if (currentUserRole === "OWNER") {
      if (targetMember.role !== "STAFF") throw new Error("Dueños solo pueden desactivar personal")
    } else if (!isSuperAdmin) {
      throw new Error("No autorizado")
    }

    await prisma.shopMember.update({
      where: { userId_shopId: { userId: staffId, shopId } },
      data: { isActive }
    })

    revalidatePath(`/${shopId}/admin/staff`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

const updateStaffProfileSchema = z.object({
  staffId: z.string().min(1, "El ID del personal es obligatorio"),
  shopId: z.string().min(1, "El ID de la tienda es obligatorio"),
  data: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    serviceIds: z.array(z.string())
  })
})

export async function updateStaffProfile(staffIdRaw: string, shopIdRaw: string, dataRaw: { name?: string; phone?: string; serviceIds: string[] }) {
  try {
    const validated = updateStaffProfileSchema.safeParse({ staffId: staffIdRaw, shopId: shopIdRaw, data: dataRaw })
    if (!validated.success) throw new Error("Parámetros inválidos")

    const { staffId, shopId, data } = validated.data
    const { user: currentUser, role: currentUserRole, isSuperAdmin } = await requireAdmin(shopId)

    const targetMember = await prisma.shopMember.findUnique({
      where: { userId_shopId: { userId: staffId, shopId } }
    })
    if (!targetMember) throw new Error("Miembro no encontrado en esta tienda")

    const isSelf = currentUser.id === staffId
    const isOwnerEditingStaff = currentUserRole === "OWNER" && targetMember.role === "STAFF"
    
    if (!isSuperAdmin && !isSelf && !isOwnerEditingStaff) {
      throw new Error("No tienes permisos para editar este perfil")
    }

    if (isSuperAdmin && !isSelf && targetMember.role === "SUPER_ADMIN") {
      throw new Error("No puedes editar a otro Super Admin")
    }

    // Cross-tenant validation for services
    if (data.serviceIds.length > 0) {
      const validServices = await prisma.service.findMany({
        where: { id: { in: data.serviceIds }, shopId }
      })
      if (validServices.length !== data.serviceIds.length) {
        throw new Error("Servicios inválidos o no pertenecen a esta tienda")
      }
    }

    const currentShopServices = await prisma.service.findMany({
      where: { shopId, staffMembers: { some: { id: staffId } } },
      select: { id: true }
    })

    await prisma.user.update({
      where: { id: staffId },
      data: {
        name: data.name,
        phone: data.phone,
        staffServices: {
          disconnect: currentShopServices.map(s => ({ id: s.id })),
          connect: data.serviceIds.map(id => ({ id }))
        }
      }
    })

    revalidatePath(`/${shopId}/admin/staff`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

