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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground italic text-sm">{t.dashboardDesc}</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent shopId={shopId} businessType={businessType} />
      </Suspense>
    </div>
  )
}
