import { getShopBySlug } from "@/lib/shop"
import { notFound } from "next/navigation"
import { BusinessThemeProvider } from "@/components/admin/business-theme-provider"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function ShopLayout({ children, params }: LayoutProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  
  if (!shop) notFound()

  return (
    <BusinessThemeProvider businessType={shop.businessType} businessSlug={slug}>
      {children}
    </BusinessThemeProvider>
  )
}
