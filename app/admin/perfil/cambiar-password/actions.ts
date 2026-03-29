"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { getAdminUser } from "@/lib/auth-utils"

export async function updatePassword(formData: FormData) {
  const account = await getAdminUser()
  if (!account?.user) throw new Error("Acceso no autorizado")

  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!password || password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres")
  }

  if (password !== confirmPassword) {
    throw new Error("Las contraseñas no coinciden")
  }

  const supabase = await createClient()

  // 1. Update password in Supabase Auth
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw new Error(error.message)
  }

  // 2. Clear the flag in Prisma
  await prisma.user.update({
    where: { id: account.user.id },
    data: { needsPasswordChange: false }
  } as any) // Type cast due to stale Prisma types in some environments

  revalidatePath("/", "layout")
  
  // Determine redirect path based on role
  let redirectPath = "/"
  if (account.role === "SUPER_ADMIN") {
    redirectPath = "/admin"
  } else if (account.memberships && account.memberships.length > 0) {
    // Redirect to the first shop they belong to
    const firstShop = account.memberships[0] as any
    redirectPath = `/${firstShop.shop.slug}/admin`
  }

  return { success: true, redirectPath }
}
