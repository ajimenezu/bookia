import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { StaffContent } from "@/components/admin/staff-content"
import { StaffSkeleton } from "@/components/admin/staff-skeleton"
import { CreateUserModal } from "@/components/admin/create-user-modal"

interface PageProps {
  params: Promise<{ slug: string }>
}

import { getShopBySlug } from "@/lib/shop"

export default async function StaffPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const { user, role, shopId, isSuperAdmin, businessType } = await requireAdmin(shop.id, `/${slug}/login`)
  const t = getTerminology(businessType as any)

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.staffPlural}</h1>
          <p className="mt-1 text-muted-foreground italic text-sm">Gestiona el equipo y personal de tu negocio</p>
        </div>
        {(role === "OWNER" || isSuperAdmin) && (
          <CreateUserModal currentUserRole={role as any} isSuperAdmin={isSuperAdmin} shopId={shopId} mode="STAFF" businessType={businessType} />
        )}
      </div>

      <Suspense fallback={<StaffSkeleton />}>
        <StaffContent 
          shopId={shopId} 
          role={role} 
          currentUserId={user.id}
          isSuperAdmin={isSuperAdmin} 
          businessType={businessType} 
        />
      </Suspense>
    </div>
  )
}
