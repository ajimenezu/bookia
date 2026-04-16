import { requireAdmin } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ServicesContent } from "@/components/admin/services-content"
import { ServicesSkeleton } from "@/components/admin/services-skeleton"
import { getShopBySlug } from "@/lib/shop"
import { getTerminology } from "@/lib/dictionaries"

interface PageProps {
  params: Promise<{ slug: string }>
}


export default async function ServiciosPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const { businessType, shopId } = await requireAdmin(shop.id)
  const t = getTerminology(businessType as any)

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.servicePlural}</h1>
        <p className="mt-1 text-muted-foreground italic text-sm">Gestiona los {t.servicePlural.toLowerCase()} de tu negocio</p>
      </div>

      <Suspense fallback={<ServicesSkeleton />}>
        <ServicesContent shopId={shopId} slug={slug} businessType={businessType as any} />
      </Suspense>
    </div>
  )
}
