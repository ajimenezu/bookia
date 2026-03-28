"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { Role } from "@prisma/client"

export async function createUser(formData: FormData) {
  const { shopId: currentShopId, role: currentUserRole, isSuperAdmin } = await requireAdmin()

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const role = formData.get("role") as Role
  const targetShopId = formData.get("shopId") as string || currentShopId
  const slug = formData.get("slug") as string

  if (!email || !role) throw new Error("Email and role are required")

  if (currentUserRole === "STAFF") {
    if (role !== "CUSTOMER") throw new Error("Staff can only create customers")
  } else if (currentUserRole === "OWNER") {
    if (role !== "STAFF" && role !== "CUSTOMER") throw new Error("Owners can only create staff and customers")
  } else if (!isSuperAdmin) {
    throw new Error("Unauthorized")
  }

  if (role === "SUPER_ADMIN" && !isSuperAdmin) throw new Error("Only Super Admins can create other Super Admins")

  try {
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          name,
          phone,
          role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "CUSTOMER"
        }
      })
    }

    if (role !== "SUPER_ADMIN" && targetShopId && targetShopId !== "ALL") {
      await prisma.shopMember.upsert({
        where: { userId_shopId: { userId: user.id, shopId: targetShopId } },
        update: { role },
        create: { userId: user.id, shopId: targetShopId, role }
      })
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    console.error("CREATE_USER_ERROR:", error)
    return { success: false, error: error.message || "Failed to create user" }
  }
}
