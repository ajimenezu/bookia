import { Suspense } from "react"
import { CalendarDays, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getWeekRange } from "@/lib/date-utils"
import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import { HoyButton } from "@/components/admin/appointments/hoy-button"
import { WeekNavigation } from "@/components/admin/appointments/week-navigation"
import { AppointmentsContent } from "@/components/admin/appointments/appointments-content"
import { AppointmentsSkeleton } from "@/components/admin/appointments/appointments-skeleton"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ week?: string; view?: string }>
}

export default async function CitasPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) notFound()

  const { businessType, shopId } = await requireAdmin(shop.id)
  const t = getTerminology(businessType)

  const sp = await searchParams
  const weekOffset = parseInt(sp.week || "0")
  const view = (sp.view as "calendar" | "list") || "calendar"
  const { rangeLabel } = getWeekRange(weekOffset)

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.appointmentPlural}</h1>
          <p className="mt-1 text-muted-foreground">Gestiona las {t.appointmentPlural.toLowerCase()} de tu negocio</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HoyButton />
          <Button variant={view === "calendar" ? "default" : "outline"} size="sm" asChild>
            <Link href={`?week=${weekOffset}&view=calendar`}>
              <CalendarDays className="mr-1.5 h-4 w-4" />
              <span className="md:hidden">Día</span>
              <span className="hidden md:inline">Semana</span>
            </Link>
          </Button>
          <Button variant={view === "list" ? "default" : "outline"} size="sm" asChild>
            <Link href={`?week=${weekOffset}&view=list`}>
              <List className="mr-1.5 h-4 w-4" /> Lista
            </Link>
          </Button>
        </div>
      </div>
      <WeekNavigation weekOffset={weekOffset} view={view} rangeLabel={rangeLabel} />
      <Suspense fallback={<AppointmentsSkeleton view={view} />}>
        <AppointmentsContent shopId={shopId} weekOffset={weekOffset} view={view} />
      </Suspense>
    </div>
  )
}
