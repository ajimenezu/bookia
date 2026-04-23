"use client"

import { useState, useMemo } from "react"
import { User } from "lucide-react"
import { StatusBadge } from "./status-badge"
import { formatTime, formatDate } from "@/lib/date-utils"
import { AppointmentActions } from "./appointment-actions"
import { AppointmentDetailSheet } from "./appointment-detail-sheet"
import { BusinessType, getTerminology } from "@/lib/dictionaries"

interface ListViewProps {
  appointments: any[]
  shopId: string
  businessType: BusinessType
  services: { id: string; name: string; price: number; duration: number }[]
  staff: { id: string; name: string }[]
}

export function ListView({ appointments, shopId, businessType, services, staff }: ListViewProps) {
  const t = getTerminology(businessType)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const selectedAppointment = useMemo(() => 
    appointments.find(a => a.id === selectedAppointmentId),
    [appointments, selectedAppointmentId]
  )

  const handleItemClick = (apt: any) => {
    setSelectedAppointmentId(apt.id)
    setIsSheetOpen(true)
  }
  return (
    <div className="rounded-xl border border-border bg-card">
      <AppointmentDetailSheet 
        appointment={selectedAppointment}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        shopId={shopId}
        businessType={businessType}
        services={services}
        staff={staff}
      />
      {appointments.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No hay {t.appointmentPlural.toLowerCase()} registradas para esta semana.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {appointments.map((apt) => {
            return (
              <div
                key={apt.id}
                onClick={() => handleItemClick(apt)}
                className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-secondary/10 transition-colors cursor-pointer active:bg-muted/10"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex flex-col items-center justify-center min-w-12 h-12 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] uppercase font-black text-primary/70 leading-none">
                      {new Date(apt.startTime).toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 3)}
                    </p>
                    <p className="text-sm font-black text-primary mt-1 leading-none">
                      {new Date(apt.startTime).toLocaleDateString("es-ES", { day: "2-digit" })}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary shrink-0">
                        {formatTime(apt.startTime)}
                      </span>
                      <p className="font-bold text-sm text-card-foreground truncate">{apt.customer?.name || apt.customerName || t.client}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {apt.services?.length > 0 ? apt.services.map((s: any) => s.name).join(', ') : apt.service?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                  <AppointmentActions 
                    appointmentId={apt.id} 
                    shopId={shopId} 
                    currentStatus={apt.status} 
                    startTime={apt.startTime}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
