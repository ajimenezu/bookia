"use server"

import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  email: z.string().email("Email inválido").toLowerCase().trim(),
})

export async function requestPasswordReset(slug: string, formData: FormData) {
  const validated = schema.safeParse(Object.fromEntries(formData.entries()))
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) return { success: false, error: "La tienda no existe" }

  const { email } = validated.data
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/${slug}/update-password`,
  })

  // Always succeed — do not leak whether the email exists.
  return { success: true }
}
