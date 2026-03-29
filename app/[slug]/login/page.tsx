import prisma from "@/lib/prisma"
import { BusinessThemeProvider } from "@/components/admin/business-theme-provider"
import { ShopLoginForm } from "@/components/shop/shop-login-form"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) return {}
  return { title: `Iniciar Sesión — ${shop.name}` }
}

export default async function ShopLoginPage({ params }: PageProps) {
  const { slug } = await params

  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) notFound()

  return (
    <BusinessThemeProvider businessType={shop.businessType} businessSlug={slug}>
      <ShopLoginForm
        slug={slug}
        shopName={shop.name}
        logoUrl={(shop as any).logoUrl ?? null}
      />
    </BusinessThemeProvider>
  )
}
