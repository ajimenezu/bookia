"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"

export async function createService(formData: FormData) {
  const { shopId: membershipShopId, isSuperAdmin } = await requireAdmin()

  const targetShopId = isSuperAdmin ? (formData.get("shopId") as string || membershipShopId) : membershipShopId

  if (targetShopId === "ALL" && isSuperAdmin) {
    throw new Error("Super Admin must specify a target shop for service creation")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = parseFloat(formData.get("price") as string)
  const duration = parseInt(formData.get("duration") as string, 10)

  if (!name || isNaN(price) || isNaN(duration)) throw new Error("Missing or invalid fields")

  await prisma.service.create({
    data: {
      id: crypto.randomUUID(),
      name,
      description,
      price,
      duration,
      shopId: targetShopId,
    },
  })

  revalidatePath("/", "layout")
}

export async function updateService(formData: FormData) {
  const serviceId = formData.get("id") as string
  const { shopId: membershipShopId, isSuperAdmin } = await requireAdmin()

  // Verify ownership
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  })

  if (!service) throw new Error("Servicio no encontrado")
  
  if (!isSuperAdmin && service.shopId !== membershipShopId) {
    throw new Error("No tienes permiso para editar este servicio")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = parseFloat(formData.get("price") as string)
  const duration = parseInt(formData.get("duration") as string, 10)

  if (!name || isNaN(price) || isNaN(duration)) throw new Error("Campos inválidos o faltantes")

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      name,
      description,
      price,
      duration,
    },
  })

  revalidatePath("/", "layout")
}

export async function deleteService(serviceId: string) {
  const { shopId: membershipShopId, isSuperAdmin } = await requireAdmin()

  // Verify ownership
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  })

  if (!service) throw new Error("Servicio no encontrado")
  
  if (!isSuperAdmin && service.shopId !== membershipShopId) {
    throw new Error("No tienes permiso para eliminar este servicio")
  }

  await prisma.service.delete({
    where: { id: serviceId },
  })

  revalidatePath("/", "layout")
}
