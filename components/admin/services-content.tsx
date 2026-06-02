import prisma from "@/lib/prisma"
import { ServicesList } from "@/components/admin/services-list"
import { BusinessType } from "@/lib/dictionaries"

interface ServicesContentProps {
  shopId: string
  slug: string
  businessType: BusinessType
  staffList: { id: string; name: string }[]
}

export async function ServicesContent({ shopId, slug, businessType, staffList }: ServicesContentProps) {
  const [services, categories] = await Promise.all([
    prisma.service.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      include: { shop: true, staffMembers: true, categories: true }
    }),
    prisma.serviceCategory.findMany({
      where: { shopId },
      orderBy: { name: "asc" }
    })
  ])

  return (
    <ServicesList services={services} categories={categories} slug={slug} shopId={shopId} businessType={businessType} staffList={staffList} />
  )
}
