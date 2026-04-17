import { BusinessThemeProvider } from "@/components/admin/business-theme-provider"
import { ShopLoginForm } from "@/components/shop/shop-login-form"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

import { getShopBySlug } from "@/lib/shop"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) return {}
  return { title: `Iniciar Sesión — ${shop.name}` }
}

export default async function ShopLoginPage({ params }: PageProps) {
  const { slug } = await params

  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  return (
    <BusinessThemeProvider businessType={shop.businessType} businessSlug={slug}>
      <ShopLoginForm
        slug={slug}
        shopName={shop.name}
        businessType={shop.businessType}
        logoUrl={(shop as any).logoUrl ?? null}
      />
    </BusinessThemeProvider>
  )
}
