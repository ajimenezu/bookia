import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getShopById } from "@/lib/shop"

/**
 * Gets the current authenticated user and their metadata.
 * Now supports global role (SUPER_ADMIN) and shop memberships.
 */
export const getAdminUser = cache(async () => {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Try to get data from JWT Custom Claims (fastest)
  const globalRole = user.app_metadata?.role as string | undefined
  // For Super Admin, we don't necessarily need a single shopId
  const shopId = user.app_metadata?.shop_id as string | undefined

  // Fallback: If claims are missing or for complex membership checks, fetch from DB
  if (!globalRole) {
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
    
    return { 
      user, 
      role: isSuperAdmin ? "SUPER_ADMIN" : "CUSTOMER",
      memberships
    }
  }

  return { user, role: globalRole, shopId }
})

/**
 * Strict version of getAdminUser for admin-only routes.
 * If user is SUPER_ADMIN, they bypass shop-specific checks.
 * Otherwise, they must be an OWNER or STAFF of the requested shop.
 */
export async function requireAdmin(targetShopId?: string) {
  const account = await getAdminUser()

  if (!account?.user) {
    redirect("/login")
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
      redirect("/schedule")
    }
  } else {
    activeMembership = memberships.find((m: any) => m.role === "OWNER" || m.role === "STAFF")
    if (!activeMembership) {
      redirect("/schedule")
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
