"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido").optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "OWNER", "STAFF", "CUSTOMER"]),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
  shopId: z.string().min(1, "El ID de la tienda es obligatorio"),
})

export async function createUser(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    password: formData.get("password"),
    shopId: formData.get("shopId"),
  }

  const validated = userSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const { name, email, phone, role, password: rawPassword, shopId: targetShopId } = validated.data
  const password = rawPassword || "Bookia123!"

  try {
    // SECURITY FIX: Mandatory targetShopId validation
    const { role: currentUserRole, isSuperAdmin } = await requireAdmin(targetShopId)

    if (currentUserRole === "STAFF") {
      if (role !== "CUSTOMER") throw new Error("Personal solo puede crear clientes")
    } else if (currentUserRole === "OWNER") {
      if (role !== "STAFF" && role !== "CUSTOMER") throw new Error("Dueños solo pueden crear personal y clientes")
    } else if (!isSuperAdmin) {
      throw new Error("No autorizado para esta tienda")
    }

    if (role === "SUPER_ADMIN" && !isSuperAdmin) throw new Error("Solo los Super Admins pueden crear otros Super Admins")

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
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find((u: any) => u.email === email)
      if (existingUser) {
        authData = { user: existingUser } as any
      } else {
        throw new Error("El usuario ya existe en Auth pero no se pudo recuperar")
      }
    } else if (authError) {
      throw new Error(authError.message)
    }

    const authUser = authData?.user
    if (!authUser) throw new Error("Error al crear el usuario en Auth")

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
    return { success: false, error: error.message || "Error al crear el usuario" }
  }
}
