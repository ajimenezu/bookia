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
  try {
    const inputShopId = formData.get("shopId") as string
    const { shopId: targetShopId } = await requireAdmin(inputShopId || undefined)

    if (targetShopId === "ALL") {
      return { success: false, error: "Debe especificar una tienda válida" }
    }

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: parseFloat(formData.get("price") as string),
      duration: parseInt(formData.get("duration") as string, 10),
      shopId: targetShopId,
    }

    const validated = serviceSchema.safeParse(rawData)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    await prisma.service.create({
      data: {
        id: crypto.randomUUID(),
        name: validated.data.name,
        description: validated.data.description,
        price: validated.data.price,
        duration: validated.data.duration,
        shopId: targetShopId,
      },
    })

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    console.error("CREATE_SERVICE_ERROR:", error)
    return { success: false, error: error.message || "Error al crear el servicio" }
  }
}

export async function updateService(formData: FormData) {
  try {
    const serviceId = formData.get("id") as string
    const inputShopId = formData.get("shopId") as string
    const { shopId: targetShopId, isSuperAdmin } = await requireAdmin(inputShopId || undefined)

    const service = await validateServiceOwnership(serviceId, targetShopId, isSuperAdmin)

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: parseFloat(formData.get("price") as string),
      duration: parseInt(formData.get("duration") as string, 10),
      shopId: service.shopId,
    }

    const validated = serviceSchema.safeParse(rawData)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: validated.data.name,
        description: validated.data.description,
        price: validated.data.price,
        duration: validated.data.duration,
      },
    })

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    console.error("UPDATE_SERVICE_ERROR:", error)
    return { success: false, error: error.message || "Error al actualizar el servicio" }
  }
}

export async function deleteService(serviceId: string) {
  try {
    const { shopId: membershipShopId, isSuperAdmin } = await requireAdmin()

    await validateServiceOwnership(serviceId, membershipShopId, isSuperAdmin)

    await prisma.service.delete({
      where: { id: serviceId },
    })

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    console.error("DELETE_SERVICE_ERROR:", error)
    return { success: false, error: error.message || "Error al eliminar el servicio" }
  }
}

