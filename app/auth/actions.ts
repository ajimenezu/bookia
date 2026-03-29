"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    throw new Error("Email and password are required")
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(error.message)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Login failed: User not found after authentication")

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  let redirectPath = "/"
  if (dbUser) {
    if (dbUser.needsPasswordChange) {
      redirectPath = "/admin/perfil/cambiar-password"
    } else if (dbUser.role === "SUPER_ADMIN" || dbUser.role === "OWNER" || dbUser.role === "STAFF") {
      redirectPath = "/admin"
    }
  }

  revalidatePath("/", "layout")
  return { success: true, redirectPath }
}

/**
 * Shop-contextual sign in. Redirects based on the user's role within the shop:
 * - OWNER/STAFF of this shop → /{slug}/admin
 * - CUSTOMER or no membership → /{slug}/mi-perfil (or /{slug} for now)
 */
export async function signInToShop(slug: string, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    throw new Error("Email y contraseña son requeridos")
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Login fallido")

  // Check if the user has a staff/owner role in this specific shop
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  const isSuperAdmin = dbUser?.role === "SUPER_ADMIN"

  const membership = !isSuperAdmin
    ? await prisma.shopMember.findFirst({
        where: { userId: user.id, shop: { slug }, role: { in: ["OWNER", "STAFF"] } }
      })
    : null

  revalidatePath("/", "layout")

  // SUPER_ADMIN, Staff/Owner → admin panel of this shop
  // Customer or no membership → landing page (/{slug}/mi-perfil when built)
  const isAdmin = isSuperAdmin || !!membership
  let redirectPath = isAdmin ? `/${slug}/admin` : `/${slug}`

  if (dbUser?.needsPasswordChange) {
    redirectPath = `/admin/perfil/cambiar-password`
  }

  return { success: true, redirectPath }
}

export async function signOut(redirectTo?: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect(redirectTo ?? "/login")
}

