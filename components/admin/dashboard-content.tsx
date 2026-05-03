"use client"

import { useState, useMemo } from "react"
import { CalendarDays, BadgeCent, TrendingUp, Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getTerminology } from "@/lib/dictionaries"
import { formatTime } from "@/lib/date-utils"
import { AppointmentActions } from "@/components/admin/appointments/appointment-actions"
import { AppointmentDetailSheet } from "@/components/admin/appointments/appointment-detail-sheet"
import { AddAppointmentSheet } from "@/components/admin/appointments/add-appointment-sheet"

interface DashboardContentProps {
  shopId: string
  businessType: string
  slug: string
  shopName: string
  whatsappPhone: string | null
  appointments: any[]
  monthCount: number
  mappedServices: any[]
  mappedStaff: any[]
  mappedClients: any[]
}

export function DashboardContent({ 
  shopId, 
  businessType, 
  slug, 
  shopName, 
  whatsappPhone,
  appointments,
  monthCount,
  mappedServices,
  mappedStaff,
  mappedClients
}: DashboardContentProps) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const selectedAppointment = useMemo(() => 
    appointments.find(a => a.id === selectedAppointmentId),
    [appointments, selectedAppointmentId]
  )

  const t = getTerminology(businessType as any)
  
  const handleItemClick = (apt: any) => {
    setSelectedAppointmentId(apt.id)
    setIsSheetOpen(true)
  }

  const activeAppointments = appointments.filter(a => a.status !== "CANCELLED" && a.status !== "NO_SHOW")
  const todayIncome = activeAppointments.reduce((acc, curr) => {
    if (curr.priceAtBooking != null) {
      return acc + curr.priceAtBooking
    }
    if (curr.services && curr.services.length > 0) {
      return acc + curr.services.reduce((sAcc: number, s: any) => sAcc + (s.price || 0), 0)
    }
    return acc + (curr.service?.price || 0)
  }, 0)

  const stats = [
    { label: `${t.appointmentPlural} hoy`, value: appointments.length.toString(), icon: CalendarDays, change: "Actualizado" },
    { label: "Ingreso estimado hoy", value: `₡${todayIncome.toLocaleString()}`, icon: BadgeCent, change: `Basado en ${t.appointmentPlural.toLowerCase()}` },
    { label: `${t.appointmentPlural} del mes`, value: monthCount.toString(), icon: TrendingUp, change: "Este mes" },
  ]

  return (
    <>
      <AppointmentDetailSheet 
        appointment={selectedAppointment}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        shopId={shopId}
        businessType={businessType as any}
        services={mappedServices}
        staff={mappedStaff}
      />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground italic text-sm">{t.dashboardDesc}</p>
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

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => (
          <div key={stat.label} className={`flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md group ${index !== 1 ? 'hidden md:flex' : ''}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-card-foreground tracking-tight">{stat.value}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 mt-0.5">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-card-foreground">{t.appointmentPlural} de hoy</h2>
          </div>
          <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">{appointments.length} {t.appointmentPlural.toLowerCase()}</Badge>
        </div>
        <div className="divide-y divide-border">
          {appointments.length === 0 ? (
            <div className="px-5 py-16 text-center text-muted-foreground">
              <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <CalendarDays className="h-8 w-8 opacity-40" />
              </div>
              <p className="font-medium">No hay {t.appointmentPlural.toLowerCase()} para hoy.</p>
              <p className="text-xs mt-1">¡Aprovecha para organizar este día!</p>
            </div>
          ) : (
            appointments.map((apt) => (
              <div 
                key={apt.id} 
                onClick={() => handleItemClick(apt)}
                className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/5 transition-colors group cursor-pointer active:bg-muted/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center min-w-14 h-12 rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <span className="font-mono text-xs font-bold leading-none">
                      {formatTime(apt.startTime).split(' ')[0]}
                    </span>
                    <span className="text-[9px] uppercase font-black mt-1 opacity-70">
                      {formatTime(apt.startTime).split(' ')[1] || 'HR'}
                    </span>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground border border-border shadow-sm">
                    {(apt.customer?.name || apt.customerName || "C").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-card-foreground leading-tight truncate">{apt.customer?.name || apt.customerName || t.client}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {(apt.serviceDetails as any[])?.length 
                        ? (apt.serviceDetails as any[]).map(s => s.name).join(", ") 
                        : (apt.services && apt.services.length > 0 
                          ? apt.services.map((s: any) => s.name).join(", ") 
                          : (apt.service?.name || "Sin servicio"))}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium bg-muted/30 px-2 py-0.5 rounded-md">
                        <User className="h-3 w-3" /> {apt.staff ? (apt.staff.name || (apt.staff as any).email?.split('@')[0] || "Staff") : "Sin asignar"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-start gap-3 border-t border-border/50 pt-3 sm:border-t-0 sm:pt-0" onClick={(e) => e.stopPropagation()}>
                  <AppointmentActions 
                    appointmentId={apt.id} 
                    shopId={shopId} 
                    currentStatus={apt.status} 
                    startTime={apt.startTime}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
