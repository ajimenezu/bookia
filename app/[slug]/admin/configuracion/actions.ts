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

  revalidatePath(`/[slug]/admin/configuracion`, "layout")
  return { success: true }
}

export async function updateShopSchedules(shopId: string, schedules: any[]) {
  const session = await requireAdmin(shopId)
  if (!session.isSuperAdmin && session.role !== "OWNER") {
    throw new Error("Solo los propietarios pueden editar el horario")
  }

  const validatedSchedules = z.array(scheduleSchema).parse(schedules)

  await prisma.$transaction(
    validatedSchedules.map((s) =>
      prisma.shopSchedule.upsert({
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
    )
  )

  revalidatePath(`/[slug]/admin/configuracion`, "layout")
  return { success: true }
}
