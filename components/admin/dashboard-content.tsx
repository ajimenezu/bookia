import { CalendarDays, BadgeCent, TrendingUp, CheckCircle2, Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAppointmentsData } from "@/lib/appointments"
import { StatusBadge } from "@/components/admin/appointments/status-badge"
import { getTerminology } from "@/lib/dictionaries"
import { AddAppointmentSheet } from "@/components/admin/appointments/add-appointment-sheet"
import prisma from "@/lib/prisma"

interface DashboardContentProps {
  shopId: string
  businessType: string
  slug: string
  shopName: string
  whatsappPhone: string | null
}

export async function DashboardContent({ shopId, businessType, slug, shopName, whatsappPhone }: DashboardContentProps) {
  const t = getTerminology(businessType as any)
  const appointments = await getAppointmentsData(shopId)
  
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

  const mappedServices = services.map(s => ({
    id: s.id,
    name: s.name,
    price: s.price,
    duration: s.duration,
  }))

  const mappedStaff = staffData.map(m => ({
    id: m.user.id,
    name: m.user.name || "Sin nombre",
  }))

  const mappedClients = clientsData.map(m => ({
    id: m.user.id,
    name: m.user.name || "Sin nombre",
    phone: m.user.phone,
  }))
  const todayIncome = appointments.reduce((acc, curr) => {
    // If services (plural) is present, sum them up
    if (curr.services && curr.services.length > 0) {
      return acc + curr.services.reduce((sAcc: number, s: any) => sAcc + (s.price || 0), 0)
    }
    // Fallback to single service
    return acc + (curr.service?.price || 0)
  }, 0)

  const stats = [
    { label: `${t.appointmentPlural} hoy`, value: appointments.length.toString(), icon: CalendarDays, change: "Actualizado" },
    { label: "Ingreso estimado hoy", value: `₡${todayIncome.toLocaleString()}`, icon: BadgeCent, change: "Basado en citas" },
    { label: `${t.appointmentPlural} totales`, value: appointments.length.toString(), icon: TrendingUp, change: "Hoy" },
  ]

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground italic text-sm">Resumen de tu negocio hoy</p>
        </div>
        <AddAppointmentSheet 
          shopId={shopId}
          shopName={shopName}
          shopSlug={slug}
          whatsappPhone={whatsappPhone}
          services={mappedServices}
          staff={mappedStaff}
          clients={mappedClients}
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/20">
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
      
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-card-foreground">{t.appointmentPlural} de hoy</h2>
          </div>
          <Badge variant="secondary" className="px-2 py-0.5">{appointments.length} {t.appointmentPlural.toLowerCase()}</Badge>
        </div>
        <div className="divide-y divide-border">
          {appointments.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground">
              <CalendarDays className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No hay {t.appointmentPlural.toLowerCase()} programadas para hoy.</p>
            </div>
          ) : (
            appointments.map((apt) => (
              <div key={apt.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-14 shrink-0 font-mono text-sm font-medium text-primary">
                    {new Date(apt.startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground border border-border">
                    {(apt.customer?.name || "C").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground leading-tight">{apt.customer?.name || t.client}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {apt.services && apt.services.length > 0 
                        ? apt.services.map((s: any) => s.name).join(", ") 
                        : (apt.service?.name || "Sin servicio")} &middot; <span className="opacity-70"><User className="mb-0.5 inline h-3 w-3" /> {apt.staff ? (apt.staff.name || (apt.staff as any).email?.split('@')[0] || "Staff") : "Sin asignar"}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-14 sm:pl-0">
                  <StatusBadge status={apt.status} />
                  {apt.status !== "COMPLETED" && (
                    <Button size="sm" variant="outline" className="h-8 text-xs font-medium border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Completar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
