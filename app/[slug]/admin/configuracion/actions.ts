"use server"

import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const shopConfigSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  whatsappPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
})

const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDuration: z.number().min(5).max(120),
  isOpen: z.boolean(),
})

export async function updateShopConfig(shopId: string, data: any) {
  const session = await requireAdmin(shopId)
  if (!session.isSuperAdmin && session.role !== "OWNER") {
    throw new Error("Solo los propietarios pueden editar la configuración")
  }

  const validated = shopConfigSchema.parse(data)

  await prisma.shop.update({
    where: { id: shopId },
    data: validated,
  })

  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } })
  if (shop) {
    revalidatePath(`/${shop.slug}/admin/configuracion`)
    revalidatePath(`/${shop.slug}/admin`)
    revalidatePath(`/admin/configuracion`)
  }
  return { success: true }
}

export async function updateShopSchedules(shopId: string, schedules: any[], syncOwnerSchedule?: boolean) {
  const session = await requireAdmin(shopId)
  if (!session.isSuperAdmin && session.role !== "OWNER") {
    throw new Error("Solo los propietarios pueden editar el horario")
  }

  const validatedSchedules = z.array(scheduleSchema).parse(schedules)

  await prisma.$transaction(async (tx) => {
    // 1. Upsert master shop schedules
    for (const s of validatedSchedules) {
      await tx.shopSchedule.upsert({
        where: { shopId_dayOfWeek: { shopId, dayOfWeek: s.dayOfWeek } },
        update: {
          openTime: s.openTime,
          closeTime: s.closeTime,
          slotDuration: s.slotDuration,
          isOpen: s.isOpen,
        },
        create: {
          shopId,
          dayOfWeek: s.dayOfWeek,
          openTime: s.openTime,
          closeTime: s.closeTime,
          slotDuration: s.slotDuration,
          isOpen: s.isOpen,
        },
      })
    }

    // 2. If syncOwnerSchedule is enabled and user is owner, sync owner's staff schedule
    if (syncOwnerSchedule && session.user?.id) {
      for (const s of validatedSchedules) {
        const existingStaffSched = await tx.staffSchedule.findUnique({
          where: {
            staffId_shopId_dayOfWeek: {
              staffId: session.user.id,
              shopId,
              dayOfWeek: s.dayOfWeek
            }
          }
        })

        if (existingStaffSched) {
          await tx.staffSchedule.update({
            where: { id: existingStaffSched.id },
            data: {
              isOpen: s.isOpen,
              openTime: s.openTime,
              closeTime: s.closeTime,
              status: "APPROVED"
            }
          })
        } else {
          await tx.staffSchedule.create({
            data: {
              staffId: session.user.id,
              shopId,
              dayOfWeek: s.dayOfWeek,
              isOpen: s.isOpen,
              openTime: s.openTime,
              closeTime: s.closeTime,
              status: "APPROVED"
            }
          })
        }
      }
    }
  })

  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } })
  if (shop) {
    revalidatePath(`/${shop.slug}/admin/configuracion`)
    revalidatePath(`/${shop.slug}/admin/staff`)
    revalidatePath(`/${shop.slug}/admin/citas`)
    revalidatePath(`/${shop.slug}/schedule`)
    revalidatePath(`/${shop.slug}/admin`)
    revalidatePath(`/admin/configuracion`)
    revalidatePath(`/admin/staff`)
    revalidatePath(`/admin/citas`)
    revalidatePath(`/schedule`)
  }

  return { success: true }
}
