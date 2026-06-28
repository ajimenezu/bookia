"use server"

import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { getShopUrl } from "@/lib/domain"
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

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getShopUrl(slug)}/update-password`,
  })

  // Always succeed — do not leak whether the email exists.
  return { success: true }
}
