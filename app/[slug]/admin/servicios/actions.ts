"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { z } from "zod"

const serviceSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  price: z.number().nonnegative("El precio debe ser un número positivo"),
  duration: z.number().int().positive("La duración debe ser un número positivo"),
  shopId: z.string().min(1, "El ID de la tienda es obligatorio"),
})

async function validateServiceOwnership(serviceId: string, membershipShopId: string, isSuperAdmin: boolean) {
  const service = await prisma.service.findUnique({
    where: { 
      id: serviceId,
      // REGLA SEGURIDAD: Aislamiento total en la query
      ...(isSuperAdmin ? {} : { shopId: membershipShopId })
    }
  })

  if (!service) throw new Error("Servicio no encontrado o sin permisos")
  return service
}

export async function createService(formData: FormData) {
  const { shopId: membershipShopId, isSuperAdmin } = await requireAdmin()

  const resolvedShopId = isSuperAdmin ? (formData.get("shopId") as string || membershipShopId) : membershipShopId

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: parseFloat(formData.get("price") as string),
    duration: parseInt(formData.get("duration") as string, 10),
    shopId: resolvedShopId, // Inyectamos el tenant resuelto
  }

  // REGLA CODE-REVIEW: Sanitización obligatoria con Zod (Alineada con Multi-tenant)
  const validated = serviceSchema.parse(rawData)

  const targetShopId = isSuperAdmin ? (validated.shopId || membershipShopId) : membershipShopId

  if (targetShopId === "ALL" && isSuperAdmin) {
    throw new Error("Super Admin debe especificar una tienda para crear servicios")
  }

  await prisma.service.create({
    data: {
      id: crypto.randomUUID(),
      name: validated.name,
      description: validated.description,
      price: validated.price,
      duration: validated.duration,
      shopId: targetShopId,
    },
  })

  revalidatePath("/", "layout")
}

export async function updateService(formData: FormData) {
  const serviceId = formData.get("id") as string
  const { shopId: membershipShopId, isSuperAdmin } = await requireAdmin()

  // REGLA SEGURIDAD: Validación de propiedad centralizada
  const service = await validateServiceOwnership(serviceId, membershipShopId, isSuperAdmin)

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: parseFloat(formData.get("price") as string),
    duration: parseInt(formData.get("duration") as string, 10),
    shopId: service.shopId, // Mantenemos consistencia con el esquema obligatorio
  }

  const validated = serviceSchema.parse(rawData)

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      name: validated.name,
      description: validated.description,
      price: validated.price,
      duration: validated.duration,
    },
  })

  revalidatePath("/", "layout")
}

export async function deleteService(serviceId: string) {
  const { shopId: membershipShopId, isSuperAdmin } = await requireAdmin()

  await validateServiceOwnership(serviceId, membershipShopId, isSuperAdmin)

  await prisma.service.delete({
    where: { id: serviceId },
  })

  revalidatePath("/", "layout")
}
