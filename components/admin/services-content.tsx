import prisma from "@/lib/prisma"
import { ServicesList } from "@/components/admin/services-list"
import { BusinessType } from "@/lib/dictionaries"

interface ServicesContentProps {
  shopId: string
  slug: string
  businessType: BusinessType
}

export async function ServicesContent({ shopId, slug, businessType }: ServicesContentProps) {
  const services = await prisma.service.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    include: { shop: true }
  }) as any[]

  return (
    <ServicesList services={services} slug={slug} shopId={shopId} businessType={businessType} />
  )
}
