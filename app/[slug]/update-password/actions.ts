"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export async function updatePasswordForShop(slug: string, formData: FormData) {
  const validated = schema.safeParse(Object.fromEntries(formData.entries()))
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "El enlace expiró. Solicita uno nuevo." }
  }

  const { error } = await supabase.auth.updateUser({ password: validated.data.password })
  if (error) return { success: false, error: error.message }

  // Clear the needsPasswordChange flag if it was set
  await prisma.user.update({
    where: { id: user.id },
    data: { needsPasswordChange: false }
  } as any).catch(() => { /* user row may not exist yet for fresh invites; ignore */ })

  // Route based on membership in this shop
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { memberships: { include: { shop: true } } }
  })

  let redirectPath = `/`
  if (dbUser) {
    const shopMembership = dbUser.memberships.find((m: any) => m.shop.slug === slug)
    if (shopMembership && (shopMembership.role === "OWNER" || shopMembership.role === "STAFF" || shopMembership.role === "SUPER_ADMIN")) {
      redirectPath = `/admin`
    }
  }

  revalidatePath("/", "layout")
  return { success: true, redirectPath }
}
