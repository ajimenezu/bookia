import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import { notFound } from "next/navigation"
import { getShopBySlug } from "@/lib/shop"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}


export default async function AdminLayout({ children, params }: LayoutProps) {
  const { slug } = await params

  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  // Validates the authenticated user has access to this specific shop
  const { businessType } = await requireAdmin(shop.id)
  const t = getTerminology(businessType)

  return (
    <AdminSidebar terminology={t} shopSlug={slug} shopId={shop.id} businessType={businessType}>{children}</AdminSidebar>
  )
}
