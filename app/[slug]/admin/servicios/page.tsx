import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { ServicesList } from "@/components/admin/services-list"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ServiciosPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) notFound()

  const { businessType } = await requireAdmin(shop.id)

  const services = await prisma.service.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
    include: { shop: true }
  }) as any[]

  return (
    <div>
      <ServicesList services={services} slug={slug} businessType={businessType} />
    </div>
  )
}
