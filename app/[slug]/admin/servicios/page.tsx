import { requireAdmin } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ServicesContent } from "@/components/admin/services-content"
import { ServicesSkeleton } from "@/components/admin/services-skeleton"
import { getShopBySlug } from "@/lib/shop"

interface PageProps {
  params: Promise<{ slug: string }>
}


export default async function ServiciosPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const { businessType, shopId } = await requireAdmin(shop.id)

  return (
    <Suspense fallback={<ServicesSkeleton />}>
      <ServicesContent shopId={shopId} slug={slug} businessType={businessType as any} />
    </Suspense>
  )
}
