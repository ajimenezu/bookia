import { Suspense } from "react"
import { getWeekRange } from "@/lib/date-utils"
import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import { HoyButton } from "@/components/admin/appointments/hoy-button"
import { DateSelector } from "@/components/admin/appointments/date-selector"
import { ViewSwitcher } from "@/components/admin/appointments/view-switcher"
import { WeekNavigation } from "@/components/admin/appointments/week-navigation"
import { AppointmentsContent } from "@/components/admin/appointments/appointments-content"
import { AppointmentsSkeleton } from "@/components/admin/appointments/appointments-skeleton"
import { AdminStatsContainer } from "@/components/admin/admin-stats-container"
import { AddAppointmentSheet } from "@/components/admin/appointments/add-appointment-sheet"
import { notFound } from "next/navigation"
import { getShopBySlug } from "@/lib/shop"
import prisma from "@/lib/prisma"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ week?: string; view?: string }>
}


export default async function CitasPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const { businessType, shopId } = await requireAdmin(shop.id)
  const t = getTerminology(businessType)

  const sp = await searchParams
  const weekOffset = parseInt(sp.week || "0")
  const view = (sp.view as "calendar" | "list") || "calendar"
  const { rangeLabel } = getWeekRange(weekOffset)

  const [services, staffData, clientsData] = await Promise.all([
    prisma.service.findMany({ where: { shopId }, orderBy: { price: "asc" } }),
    prisma.shopMember.findMany({
      where: { shopId, role: { in: ["STAFF", "OWNER"] } },
      include: { user: { select: { id: true, name: true } } }
    }),
    prisma.shopMember.findMany({
      where: { shopId, role: "CUSTOMER" },
      include: { user: { select: { id: true, name: true, phone: true } } }
    })
  ])

  const mappedServices = services.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration }))
  const mappedStaff = staffData.map(m => ({ id: m.user.id, name: m.user.name || "Sin nombre" }))
  const mappedClients = clientsData.map(m => ({ id: m.user.id, name: m.user.name || "Sin nombre", phone: m.user.phone }))

  // Fetch all schedules to evaluate natively on the client
  const shopSchedules = await prisma.shopSchedule.findMany({
    where: { shopId: shop.id }
  })
  
  const mappedSchedules = shopSchedules.map(s => ({
    dayOfWeek: s.dayOfWeek,
    closeTime: s.closeTime,
    isOpen: s.isOpen
  }))

  return (
    <div>
      <AdminStatsContainer shopId={shopId} businessType={businessType as any} />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.appointmentPlural}</h1>
          <p className="mt-1 text-muted-foreground">Gestiona las {t.appointmentPlural.toLowerCase()} de tu negocio</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:gap-2">
          <div className="flex items-center gap-2">
            <HoyButton />
            <DateSelector />
            <div className="sm:hidden flex-1" /> {/* Spacer on mobile */}
            <div className="hidden sm:block">
              <ViewSwitcher currentView={view} weekOffset={weekOffset} />
            </div>
          </div>
          <div className="sm:hidden">
            <ViewSwitcher currentView={view} weekOffset={weekOffset} />
          </div>
          <AddAppointmentSheet
            shopId={shopId}
            shopName={shop.name}
            shopSlug={slug}
            businessType={businessType}
            whatsappPhone={shop.whatsappPhone}
            services={mappedServices}
            staff={mappedStaff}
            clients={mappedClients}
            shopSchedules={mappedSchedules}
          />
        </div>
      </div>
      <WeekNavigation weekOffset={weekOffset} view={view} rangeLabel={rangeLabel} />
      <Suspense key={`${weekOffset}-${view}`} fallback={<AppointmentsSkeleton view={view} />}>
        <AppointmentsContent shopId={shopId} businessType={businessType as any} weekOffset={weekOffset} view={view} />
      </Suspense>
    </div>
  )
}
