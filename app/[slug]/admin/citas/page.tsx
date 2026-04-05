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
import { notFound } from "next/navigation"
import { getShopBySlug } from "@/lib/shop"

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

  return (
    <div>
      <AdminStatsContainer shopId={shopId} />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.appointmentPlural}</h1>
          <p className="mt-1 text-muted-foreground">Gestiona las {t.appointmentPlural.toLowerCase()} de tu negocio</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HoyButton />
          <DateSelector />
          <ViewSwitcher currentView={view} weekOffset={weekOffset} />
        </div>
      </div>
      <WeekNavigation weekOffset={weekOffset} view={view} rangeLabel={rangeLabel} />
      <Suspense key={`${weekOffset}-${view}`} fallback={<AppointmentsSkeleton view={view} />}>
        <AppointmentsContent shopId={shopId} weekOffset={weekOffset} view={view} />
      </Suspense>
    </div>
  )
}
