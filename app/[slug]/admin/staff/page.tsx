import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { StaffContent } from "@/components/admin/staff-content"
import { StaffSkeleton } from "@/components/admin/staff-skeleton"

interface PageProps {
  params: Promise<{ slug: string }>
}

import { getShopBySlug } from "@/lib/shop"

export default async function StaffPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const { role, shopId, isSuperAdmin, businessType } = await requireAdmin(shop.id)
  const t = getTerminology(businessType as any)

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.staffPlural}</h1>
        <p className="mt-1 text-muted-foreground italic text-sm">Gestiona el equipo y personal de tu negocio</p>
      </div>

      <Suspense fallback={<StaffSkeleton />}>
        <StaffContent 
          shopId={shopId} 
          role={role} 
          isSuperAdmin={isSuperAdmin} 
          businessType={businessType} 
        />
      </Suspense>
    </div>
  )
}
