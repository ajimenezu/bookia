import { requireAdmin } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ServicesContent } from "@/components/admin/services-content"
import { ServicesSkeleton } from "@/components/admin/services-skeleton"
import { getShopBySlug } from "@/lib/shop"
import { getTerminology } from "@/lib/dictionaries"
import prisma from "@/lib/prisma"

import { CreateServiceButton } from "@/components/admin/create-service-button"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ServiciosPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const { businessType, shopId } = await requireAdmin(shop.id, `/login`)
  const t = getTerminology(businessType as any)

  const [staffMembers, categories] = await Promise.all([
    prisma.shopMember.findMany({
      where: {
        shopId,
        role: { in: ["OWNER", "STAFF"] },
        isActive: true,
      },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.serviceCategory.findMany({
      where: { shopId },
      orderBy: { name: "asc" }
    })
  ])
  
  const staffList = staffMembers.map(m => ({ id: m.userId, name: m.user.name || m.user.email }))

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.servicePlural}</h1>
          <p className="mt-1 text-muted-foreground italic text-sm">Gestiona los {t.servicePlural.toLowerCase()} de tu negocio</p>
        </div>
        <CreateServiceButton shopId={shopId} slug={slug} businessType={businessType as any} staffList={staffList} categoriesList={categories} />
      </div>

      <Suspense fallback={<ServicesSkeleton />}>
        <ServicesContent shopId={shopId} slug={slug} businessType={businessType as any} staffList={staffList} />
      </Suspense>
    </div>
  )
}
