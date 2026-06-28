import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getShopById } from "@/lib/shop"
import { Role } from "@prisma/client"

export interface MembershipWithShop {
  role: Role
  shopId: string
  shop?: {
    slug: string
    id: string
  } | null
}

export interface UserWithMemberships {
  id: string
  email: string
  needsPasswordChange?: boolean
  memberships?: MembershipWithShop[]
}

/**
 * Gets the current authenticated user and their metadata.
 * Now supports global role (SUPER_ADMIN) and shop memberships.
 */
export const getAdminUser = cache(async () => {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fallback: Fetch from DB to get memberships and ensure accurate role
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { 
      memberships: {
        include: { shop: true }
      }
    }
  })
  
  const memberships = dbUser?.memberships || []
  const isSuperAdmin = memberships.some(m => m.role === "SUPER_ADMIN")

  // Try to get data from JWT Custom Claims (fastest)
  const globalRole = user.app_metadata?.role as string | undefined
  const shopId = user.app_metadata?.shop_id as string | undefined

  let fallbackRole = "CUSTOMER"
  if (isSuperAdmin) {
    fallbackRole = "SUPER_ADMIN"
  } else if (memberships.some(m => m.role === "OWNER")) {
    fallbackRole = "OWNER"
  } else if (memberships.some(m => m.role === "STAFF")) {
    fallbackRole = "STAFF"
  }

  return { 
    user, 
    role: globalRole || fallbackRole,
    shopId,
    memberships
  }
})

/**
 * Gets the specific role for a user in a given shop context.
 */
export function getShopRole(account: any, shopIdOrSlug: string): Role | "CUSTOMER" {
  if (!account) return "CUSTOMER"
  
  // Super Admin has global privileges
  if (account.role === "SUPER_ADMIN") return "SUPER_ADMIN"
  
  const memberships = account.memberships || []
  const membership = memberships.find((m: any) => 
    m.shopId === shopIdOrSlug || m.shop?.slug === shopIdOrSlug
  )
  
  return (membership?.role as Role) || "CUSTOMER"
}

/**
 * Strict version of getAdminUser for admin-only routes.
 * If user is SUPER_ADMIN, they bypass shop-specific checks.
 * Otherwise, they must be an OWNER or STAFF of the requested shop.
 */
export async function requireAdmin(targetShopId?: string, loginRedirect?: string) {
  const account = await getAdminUser()

  if (!account?.user) {
    redirect(loginRedirect ?? "/login")
  }

  // Super Admin has global access
  if (account.role === "SUPER_ADMIN") {
    const shop = targetShopId && targetShopId !== "ALL" 
      ? await prisma.shop.findUnique({ where: { id: targetShopId } })
      : null

    return {
      user: account.user,
      role: "SUPER_ADMIN",
      shopId: targetShopId || "ALL",
      businessType: (shop as any)?.businessType || "BARBERIA" as const,
      isSuperAdmin: true
    }
  }

  // Regular Admin checks
  const memberships = (account as any).memberships || []
  
  let activeMembership
  if (targetShopId) {
    activeMembership = memberships.find((m: any) => m.shopId === targetShopId)
    if (!activeMembership || (activeMembership.role !== "OWNER" && activeMembership.role !== "STAFF")) {
      redirect(loginRedirect ?? "/login")
    }
  } else {
    activeMembership = memberships.find((m: any) => m.role === "OWNER" || m.role === "STAFF")
    if (!activeMembership) {
      redirect(loginRedirect ?? "/login")
    }
  }

  const shop = await getShopById(activeMembership.shopId)

  return {
    user: account.user,
    role: activeMembership.role,
    shopId: activeMembership.shopId,
    businessType: (shop as any)?.businessType || "BARBERIA" as const,
    isSuperAdmin: false
  }
}

/**
 * Shared redirection logic based on user roles and context
 */
export async function getRedirectPath(
  dbUser: UserWithMemberships, 
  currentShopSlug?: string
): Promise<string> {
  // Paths are root-relative: auth happens on the shop's own subdomain, so the
  // current host already scopes the shop. `currentShopSlug` is the host's shop.
  if (dbUser.needsPasswordChange) {
    return "/admin/perfil/cambiar-password"
  }

  const memberships = dbUser.memberships || []

  // 1. Super Admin always lands on the admin view (super-admin bypass in
  //    requireAdmin grants access regardless of membership in the host shop).
  const isSuperAdmin = memberships.some(m => m.role === "SUPER_ADMIN")
  if (isSuperAdmin) {
    return "/admin"
  }

  // 2. OWNER/STAFF of the current shop → admin; otherwise the shop home.
  if (currentShopSlug) {
    const shopMembership = memberships.find(m => m.shop?.slug === currentShopSlug)
    if (shopMembership && (shopMembership.role === "OWNER" || shopMembership.role === "STAFF")) {
      return "/admin"
    }
    return "/"
  }

  return "/"
}

