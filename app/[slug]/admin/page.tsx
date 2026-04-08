import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { DashboardContent } from "@/components/admin/dashboard-content"
import { DashboardSkeleton } from "@/components/admin/dashboard-skeleton"

interface PageProps {
  params: Promise<{ slug: string }>
}

import { getShopBySlug } from "@/lib/shop"

export default async function AdminDashboard({ params }: PageProps) {
  const { slug } = await params
  
  // 1. Get the shop by slug first (this is public info anyway)
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  // 2. IMMEDIATELY verify admin rights for THIS specific shop
  const { businessType, shopId } = await requireAdmin(shop.id)

  const t = getTerminology(businessType as any)

  return (
    <div className="animate-in fade-in duration-500">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent shopId={shopId} businessType={businessType} slug={slug} shopName={shop.name} whatsappPhone={shop.whatsappPhone} />
      </Suspense>
    </div>
  )
}
