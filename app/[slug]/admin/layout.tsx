import { AdminSidebar } from "@/components/admin/admin-sidebar"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import { BusinessThemeProvider } from "@/components/admin/business-theme-provider"
import { notFound } from "next/navigation"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function AdminLayout({ children, params }: LayoutProps) {
  const { slug } = await params

  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) notFound()

  // Validates the authenticated user has access to this specific shop
  const { businessType } = await requireAdmin(shop.id)
  const t = getTerminology(businessType)

  return (
    <BusinessThemeProvider businessType={businessType} businessSlug={slug}>
      <AdminSidebar terminology={t} shopSlug={slug}>{children}</AdminSidebar>
    </BusinessThemeProvider>
  )
}
