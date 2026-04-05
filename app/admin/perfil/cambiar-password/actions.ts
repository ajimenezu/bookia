"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { getAdminUser } from "@/lib/auth-utils"
import { z } from "zod"

const passwordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export async function updatePassword(formData: FormData) {
  const account = await getAdminUser()
  if (!account?.user) throw new Error("Acceso no autorizado")

  const rawData = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }

  const validated = passwordSchema.safeParse(rawData)
  if (!validated.success) {
    throw new Error(validated.error.errors[0].message)
  }

  const { password } = validated.data
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
