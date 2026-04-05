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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { memberships: { include: { shop: true } } }
  })

  let redirectPath = "/"
  if (dbUser) {
    if (dbUser.needsPasswordChange) {
      redirectPath = "/admin/perfil/cambiar-password"
    } else {
      const isSuperAdmin = dbUser.memberships.some(m => m.role === "SUPER_ADMIN")
      if (isSuperAdmin) {
        const firstShop = await prisma.shop.findFirst()
        if (firstShop) redirectPath = `/${firstShop.slug}/admin`
      } else {
        const adminMembership = dbUser.memberships.find(m => m.role === "OWNER" || m.role === "STAFF")
        if (adminMembership?.shop) {
          redirectPath = `/${adminMembership.shop.slug}/admin`
        }
      }
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

  // HARDENING: Verify shop existence first
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) {
    throw new Error("La tienda no existe o el enlace es incorrecto")
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Login fallido")

  // Check memberships for admin roles
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { memberships: { include: { shop: true } } }
  })
  
  const isSuperAdmin = dbUser?.memberships.some(m => m.role === "SUPER_ADMIN")
  const hasShopAdminRole = dbUser?.memberships.some(m => m.shop.slug === slug && (m.role === "OWNER" || m.role === "STAFF"))

  revalidatePath("/", "layout")

  // SUPER_ADMIN, Staff/Owner -> admin panel of this shop
  // Customer or no membership -> landing page
  const isAdmin = isSuperAdmin || hasShopAdminRole
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

