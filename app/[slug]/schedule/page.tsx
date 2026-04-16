import prisma from "@/lib/prisma"
import { BookingFlow } from "@/components/booking/booking-flow"
import { BusinessThemeProvider } from "@/components/admin/business-theme-provider"
import { getAdminUser } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ShopNavbar } from "@/components/shop/shop-navbar"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) return {}
  return { title: `Reservar cita — ${shop.name}` }
}

export default async function ShopSchedulePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { service } = await searchParams
  const initialServiceId = typeof service === 'string' ? service : undefined
  const account = await getAdminUser()
  
  const user = account?.user ? {
    name: account.user.user_metadata?.full_name || account.user.email,
    phone: account.user.user_metadata?.phone || null
  } : null

  const shop = await prisma.shop.findFirst({
    where: { slug },
    include: {
      services: {
        orderBy: { price: "asc" }
      },
      memberships: {
        where: { role: { in: ["STAFF", "OWNER"] } },
        include: { user: { select: { id: true, name: true } } }
      }
    }
  })

  if (!shop) {
    notFound()
  }

  const services = shop.services.map(s => ({
    id: s.id,
    name: s.name,
    price: s.price,
    duration: s.duration,
    description: s.description,
  }))

  const staff = shop.memberships.map(m => ({
    id: m.user.id,
    name: m.user.name || "Sin nombre",
  }))

  // Fetch all schedules for this shop to evaluate dynamically on the client
  const shopSchedules = await prisma.shopSchedule.findMany({
    where: { shopId: shop.id }
  })
  
  const mappedSchedules = shopSchedules.map(s => ({
    dayOfWeek: s.dayOfWeek,
    closeTime: s.closeTime,
    isOpen: s.isOpen
  }))

  return (
    <BusinessThemeProvider businessType={shop.businessType} businessSlug={shop.slug}>
      <div className="min-h-screen bg-background flex flex-col">
        <ShopNavbar shop={shop} user={user} showScheduleButton={false} />
        
        <main className="flex-1 pb-20">
          <div className="mx-auto max-w-5xl px-4 pt-6">
            <Link 
              href={`/${shop.slug}`}
              className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Volver al inicio
            </Link>

            <div className="mx-auto max-w-lg">
              <BookingFlow
                shopId={shop.id}
                shopName={shop.name}
                shopSlug={shop.slug}
                businessType={shop.businessType}
                whatsappPhone={shop.whatsappPhone}
                services={services}
                staff={staff}
                initialClientName={user?.name ?? undefined}
                initialClientPhone={user?.phone ?? undefined}
                hideHeader={true}
                shopSchedules={mappedSchedules}
                initialServiceId={initialServiceId}
              />
            </div>
          </div>
        </main>
      </div>
    </BusinessThemeProvider>
  )
}
