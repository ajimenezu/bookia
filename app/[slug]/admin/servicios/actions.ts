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
  staffIds: z.array(z.string()).min(1, "Debe seleccionar al menos un miembro del equipo para este servicio"),
  category: z.string().min(1, "Debe seleccionar una categoría para este servicio")
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
      staffIds: formData.getAll("staffIds"),
      category: formData.get("category"),
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
        staffMembers: {
          connect: validated.data.staffIds.map(id => ({ id }))
        },
        categories: {
          connectOrCreate: {
            where: { shopId_name: { shopId: targetShopId, name: validated.data.category.trim() } },
            create: { name: validated.data.category.trim(), shopId: targetShopId }
          }
        }
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
      staffIds: formData.getAll("staffIds"),
      category: formData.get("category"),
    }

    const validated = serviceSchema.safeParse(rawData)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    await prisma.service.update({
      where: { id: serviceId, shopId: targetShopId }, // SECURITY: Defense-in-depth scoping
      data: {
        name: validated.data.name,
        description: validated.data.description,
        price: validated.data.price,
        duration: validated.data.duration,
        staffMembers: {
          set: validated.data.staffIds.map(id => ({ id }))
        },
        categories: {
          set: [],
          connectOrCreate: {
            where: { shopId_name: { shopId: targetShopId, name: validated.data.category.trim() } },
            create: { name: validated.data.category.trim(), shopId: targetShopId }
          }
        }
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
      where: { id: serviceId, shopId: membershipShopId }, // SECURITY: Defense-in-depth scoping
    })

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    console.error("DELETE_SERVICE_ERROR:", error)
    return { success: false, error: error.message || "Error al eliminar el servicio" }
  }
}

