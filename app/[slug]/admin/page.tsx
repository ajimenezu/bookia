import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { DashboardContent } from "@/components/admin/dashboard-content"
import { DashboardSkeleton } from "@/components/admin/dashboard-skeleton"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function AdminDashboard({ params }: PageProps) {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) notFound()

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
