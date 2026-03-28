import { CalendarDays, BadgeCent, TrendingUp, CheckCircle2, Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAppointmentsData } from "@/lib/appointments"
import { StatusBadge } from "@/components/admin/appointments/status-badge"
import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function AdminDashboard({ params }: PageProps) {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) notFound()

  const { businessType, shopId } = await requireAdmin(shop.id)
  const t = getTerminology(businessType)
  const appointments = await getAppointmentsData(shopId)
  const todayIncome = appointments.reduce((acc, curr) => acc + (curr.service?.price || 0), 0)

  const stats = [
    { label: `${t.appointmentPlural} hoy`, value: appointments.length.toString(), icon: CalendarDays, change: "Actualizado" },
    { label: "Ingreso estimado hoy", value: `₡${todayIncome.toLocaleString()}`, icon: BadgeCent, change: "Basado en citas" },
    { label: `${t.appointmentPlural} totales`, value: appointments.length.toString(), icon: TrendingUp, change: "Hoy" },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">{t.dashboardDesc}</p>
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-card-foreground">{t.appointmentPlural} de hoy</h2>
          </div>
          <Badge variant="secondary">{appointments.length} {t.appointmentPlural.toLowerCase()}</Badge>
        </div>
        <div className="divide-y divide-border">
          {appointments.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground">
              No hay {t.appointmentPlural.toLowerCase()} programadas para hoy.
            </div>
          ) : (
            appointments.map((apt) => (
              <div key={apt.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-14 shrink-0 font-mono text-sm font-medium text-primary">
                    {new Date(apt.startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {(apt.customer?.name || "C").split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{apt.customer?.name || t.client}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.service?.name} &middot; <User className="mb-0.5 inline h-3 w-3" /> {apt.staff ? (apt.staff.name || (apt.staff as any).email?.split('@')[0] || "Staff") : "Sin asignar"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-14 sm:pl-0">
                  <StatusBadge status={apt.status} />
                  {apt.status !== "COMPLETED" && (
                    <Button size="sm" variant="outline" className="text-xs">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Completar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
