import { requireAdmin } from "@/lib/auth-utils"
import { getShopBySlug } from "@/lib/shop"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ShopConfigContent } from "@/components/admin/shop-config-content"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ConfiguracionPage({ params }: PageProps) {
  const { slug } = await params
  
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  // SECURITY: Only Owners and Super Admins can access configuration
  const session = await requireAdmin(shop.id)
  if (!session.isSuperAdmin && session.role !== "OWNER") {
    redirect(`/${slug}/admin`)
  }

  // Fetch shop details and current schedules
  const [shopDetails, schedules] = await Promise.all([
    prisma.shop.findUnique({
      where: { id: shop.id },
      select: {
        id: true,
        name: true,
        description: true,
        whatsappPhone: true,
        address: true,
      }
    }),
    prisma.shopSchedule.findMany({
      where: { shopId: shop.id }
    })
  ])

  if (!shopDetails) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona la identidad de tu negocio y sus reglas de operación.
        </p>
      </div>

      <ShopConfigContent 
        shopId={shop.id} 
        initialShop={shopDetails} 
        initialSchedules={schedules} 
      />
    </div>
  )
}
