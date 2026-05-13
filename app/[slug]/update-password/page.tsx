import { ShopUpdatePasswordForm } from "@/components/shop/shop-update-password-form"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getShopBySlug } from "@/lib/shop"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) return {}
  return { title: `Nueva contraseña — ${shop.name}` }
}

export default async function ShopUpdatePasswordPage({ params }: PageProps) {
  const { slug } = await params

  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  return (
    <ShopUpdatePasswordForm
      slug={slug}
      shopName={shop.name}
      businessType={shop.businessType}
      logoUrl={(shop as any).logoUrl ?? null}
    />
  )
}
