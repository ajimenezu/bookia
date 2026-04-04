"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { Role } from "@prisma/client"

import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function createUser(formData: FormData) {
  const { shopId: currentShopId, role: currentUserRole, isSuperAdmin } = await requireAdmin()

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const role = formData.get("role") as Role
  const password = formData.get("password") as string || "Bookia123!" // Default temp password
  const targetShopId = formData.get("shopId") as string || currentShopId

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
    const supabaseAdmin = createServiceRoleClient()

    // 1. Check/Create in Supabase Auth using Service Role
    let { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    })

    // If user already exists in Auth, we might want to just link them if they are not in our DB
    if (authError && authError.message.includes("already registered")) {
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find(u => u.email === email)
      if (existingUser) {
        authData = { user: existingUser }
      } else {
        throw new Error("User exists in Auth but could not be retrieved")
      }
    } else if (authError) {
      throw new Error(authError.message)
    }

    const authUser = authData.user
    if (!authUser) throw new Error("Failed to create auth user")

    // 2. Create or Update in Prisma using the Auth UUID
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        id: authUser.id,
        name,
        phone,
        needsPasswordChange: true 
      },
      create: {
        id: authUser.id,
        email,
        name,
        phone,
        needsPasswordChange: true
      }
    })

    // 3. Link to Shop (including SUPER_ADMIN roles)
    if (targetShopId && targetShopId !== "ALL") {
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
