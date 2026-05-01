import { getShopBySlug } from "@/lib/shop"
import { getAdminUser } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { ShopLanding } from "@/components/shop/shop-landing"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) return {}
  return {
    title: shop.name,
    description: (shop as any).tagline || `Reserva tu cita en ${shop.name}`,
  }
}

export default async function ShopPublicPage({ params }: PageProps) {
  const { slug } = await params
  const account = await getAdminUser()
  const user = account?.user ? {
    name: account.user.user_metadata?.full_name || account.user.email,
    email: account.user.email,
    phone: account.user.user_metadata?.phone || null
  } : null

  // Note: We use a raw query here instead of getShopBySlug because we need specific includes
  const shop = await prisma.shop.findFirst({
    where: { slug },
    include: {
      services: { orderBy: { price: "asc" } },
      memberships: {
        where: { role: { in: ["STAFF", "OWNER"] } },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  })

  if (!shop) notFound()

  const services = shop.services.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    duration: s.duration,
    description: s.description,
  }))

  const staff = shop.memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name || "Sin nombre",
  }))

  const shopData = {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    businessType: shop.businessType,
    logoUrl: (shop as any).logoUrl as string | null,
    tagline: (shop as any).tagline as string | null,
    description: (shop as any).description as string | null,
    address: (shop as any).address as string | null,
    whatsappPhone: (shop as any).whatsappPhone as string | null,
    instagramUrl: (shop as any).instagramUrl as string | null,
    facebookUrl: (shop as any).facebookUrl as string | null,
  }

  return (
    <ShopLanding 
      shop={shopData} 
      services={services} 
      staff={staff} 
      user={user}
      role={account?.role}
    />
  )
}
