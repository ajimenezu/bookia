"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const signInSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase().trim(),
  password: z.string().min(1, "La contraseña es requerida")
})

const signUpSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase().trim(),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  name: z.string().min(2, "El nombre es mandatorio"),
  phone: z.string().min(8, "Teléfono inválido").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

/**
 * Shared redirection logic based on user roles and context
 */
function getRedirectPath(dbUser: any, currentShopSlug?: string): string {
  if (dbUser.needsPasswordChange) {
    return "/admin/perfil/cambiar-password"
  }

  const memberships = dbUser.memberships || []
  
  // 1. Super Admin always goes to an admin view
  const isSuperAdmin = memberships.some((m: any) => m.role === "SUPER_ADMIN")
  if (isSuperAdmin) {
    return currentShopSlug ? `/${currentShopSlug}/admin` : "/admin" // Fallback to generic admin if slug missing
  }

  // 2. If in shop context, check if they are STAFF/OWNER of THIS shop
  if (currentShopSlug) {
    const shopMembership = memberships.find((m: any) => m.shop.slug === currentShopSlug)
    if (shopMembership && (shopMembership.role === "OWNER" || shopMembership.role === "STAFF")) {
      return `/${currentShopSlug}/admin`
    }
    return `/${currentShopSlug}` // Customer or no membership in this shop
  }

  // 3. General login (outside shop context) - find first admin role
  const firstAdminMembership = memberships.find((m: any) => m.role === "OWNER" || m.role === "STAFF")
  if (firstAdminMembership?.shop) {
    return `/${firstAdminMembership.shop.slug}/admin`
  }

  return "/"
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const validated = signInSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const { email, password } = validated.data

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Login failed: User not found after authentication" }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { memberships: { include: { shop: true } } }
  })

  let redirectPath = "/"
  if (dbUser) {
    redirectPath = getRedirectPath(dbUser)
    // If it's still "/", and they are Super Admin, try to find ANY shop
    if (redirectPath === "/" && dbUser.memberships.some(m => m.role === "SUPER_ADMIN")) {
      const firstShop = await prisma.shop.findFirst()
      if (firstShop) redirectPath = `/${firstShop.slug}/admin`
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

  const validated = signInSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const { email, password } = validated.data

  // HARDENING: Verify shop existence first
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) {
    return { success: false, error: "La tienda no existe o el enlace es incorrecto" }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Distinguish between wrong credentials and non-existence if possible, but Supabase genericizes.
    // However, we can map common messages.
    if (error.message.includes("Email not confirmed")) {
      return { success: false, error: "Por favor, confirma tu correo electrónico antes de entrar." }
    }
    return { success: false, error: "Credenciales inválidas. Verifica tu correo y contraseña." }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Login fallido" }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { memberships: { include: { shop: true } } }
  })
  
  const redirectPath = getRedirectPath(dbUser, slug)

  revalidatePath("/", "layout")
  return { success: true, redirectPath }
}


export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const validated = signUpSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const { email, password, name, phone } = validated.data

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone,
      }
    }
  })

  if (error) return { success: false, error: error.message }
  if (!user) return { success: false, error: "SignUp failed" }

  // Create user in Prisma if it doesn't exist
  await prisma.user.upsert({
    where: { id: user.id },
    update: { name, phone },
    create: {
      id: user.id,
      email,
      name,
      phone,
    }
  })

  return { success: true }
}

/**
 * Shop-contextual sign up. Creates a CUSTOMER membership for the shop.
 */
export async function signUpToShop(slug: string, formData: FormData) {
  const supabase = await createClient()

  const validated = signUpSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const { email, password, name, phone } = validated.data

  // Verify shop existence
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) return { success: false, error: "La tienda no existe" }

  // PRE-SIGNUP CHECK: If user exists in Prisma, they must exist in Supabase.
  const existingPrismaUser = await prisma.user.findUnique({ where: { email } })
  if (existingPrismaUser) {
    return { success: false, error: "Este correo ya está registrado. Por favor, inicia sesión." }
  }

  // 1. Supabase SignUp
  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone,
      }
    }
  })

  if (error) return { success: false, error: error.message }
  if (!user) return { success: false, error: "Error al crear la cuenta" }

  // 2. Prisma User & Membership
  await prisma.$transaction(async (tx) => {
    const dbUser = await tx.user.upsert({
      where: { id: user.id },
      update: { name, phone },
      create: {
        id: user.id,
        email,
        name,
        phone,
      }
    })

    await tx.shopMember.upsert({
      where: {
        userId_shopId: {
          userId: dbUser.id,
          shopId: shop.id,
        }
      },
      update: {
        role: "CUSTOMER"
      },
      create: {
        userId: dbUser.id,
        shopId: shop.id,
        role: "CUSTOMER"
      }
    })
  })

  revalidatePath("/", "layout")
  return { success: true, redirectPath: `/${slug}` }
}

export async function signOut(redirectTo?: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect(redirectTo ?? "/login")
}

