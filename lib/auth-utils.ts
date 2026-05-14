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

  return { 
    user, 
    role: globalRole || (isSuperAdmin ? "SUPER_ADMIN" : "CUSTOMER"),
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
  if (dbUser.needsPasswordChange) {
    return "/admin/perfil/cambiar-password"
  }

  const memberships = dbUser.memberships || []
  
  // 1. Super Admin always goes to an admin view
  const isSuperAdmin = memberships.some(m => m.role === "SUPER_ADMIN")
  if (isSuperAdmin) {
    if (currentShopSlug) return `/${currentShopSlug}/admin`
    
    // If no shop context, try to find the first shop for this super admin or just any shop
    const firstShop = await prisma.shop.findFirst({
      select: { slug: true }
    })
    return firstShop ? `/${firstShop.slug}/admin` : "/admin"
  }

  // 2. If in shop context, check if they are STAFF/OWNER of THIS shop
  if (currentShopSlug) {
    const shopMembership = memberships.find(m => m.shop?.slug === currentShopSlug)
    if (shopMembership && (shopMembership.role === "OWNER" || shopMembership.role === "STAFF")) {
      return `/${currentShopSlug}/admin`
    }
    return `/${currentShopSlug}`
  }

  // 3. General login (outside shop context) - find first admin role
  const firstAdminMembership = memberships.find(m => m.role === "OWNER" || m.role === "STAFF")
  if (firstAdminMembership?.shop) {
    return `/${firstAdminMembership.shop.slug}/admin`
  }

  return "/"
}

