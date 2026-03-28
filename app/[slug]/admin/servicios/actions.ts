"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"

export async function createService(formData: FormData) {
  const { shopId: membershipShopId, isSuperAdmin } = await requireAdmin()

  const targetShopId = isSuperAdmin ? (formData.get("shopId") as string || membershipShopId) : membershipShopId
  const slug = formData.get("slug") as string

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
  redirect(`/${slug}/admin/servicios`)
}
