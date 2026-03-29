import prisma from "@/lib/prisma"
import { BookingFlow } from "@/components/booking/booking-flow"
import { BusinessThemeProvider } from "@/components/admin/business-theme-provider"

export default async function BarberiaDemo() {
  const shopId = "shop-1"

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
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
    return <div className="flex min-h-screen items-center justify-center">Shop not found</div>
  }

  const businessType = (shop as any).businessType || "BARBERIA"

  const services = shop.services.map(s => ({
    id: s.id,
    name: s.name,
    price: s.price,
    duration: s.duration,
  }))

  const staff = shop.memberships.map(m => ({
    id: m.user.id,
    name: m.user.name || "Sin nombre",
  }))

  return (
    <BusinessThemeProvider businessType={businessType}>
      <BookingFlow
        shopId={shopId}
        shopName={shop.name}
        whatsappPhone={shop.whatsappPhone}
        services={services}
        staff={staff}
      />
    </BusinessThemeProvider>
  )
}
