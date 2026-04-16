"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import { formatTime } from "@/lib/date-utils"
import { AppointmentActions } from "./appointment-actions"
import { AppointmentDetailSheet } from "./appointment-detail-sheet"
import { BusinessType, getTerminology } from "@/lib/dictionaries"

interface CalendarViewProps {
  dates: any[]
  appointments: any[]
  shopId: string
  businessType: BusinessType
  services: { id: string; name: string; price: number; duration: number }[]
  staff: { id: string; name: string }[]
}

export function CalendarView({ dates, appointments, shopId, businessType, services, staff }: CalendarViewProps) {
  const t = getTerminology(businessType)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const selectedAppointment = useMemo(() => 
    appointments.find(a => a.id === selectedAppointmentId),
    [appointments, selectedAppointmentId]
  )

  const todayIndex = useMemo(
    () => Math.max(dates.findIndex((d) => d.isToday), 0),
    [dates]
  )
  const [selectedDay, setSelectedDay] = useState(todayIndex)

  // Sync selected day when dates change
  useEffect(() => {
    setSelectedDay(todayIndex)
  }, [todayIndex])

  // Listen for the Hoy button click to reset day locally without server request
  useEffect(() => {
    const handleReset = () => setSelectedDay(todayIndex)
    window.addEventListener("reset-calendar-today", handleReset)
    return () => window.removeEventListener("reset-calendar-today", handleReset)
  }, [todayIndex])

  const handleCardClick = (apt: any) => {
    setSelectedAppointmentId(apt.id)
    setIsSheetOpen(true)
  }

  const d = dates[selectedDay]
  const dayAppts = useMemo(
    () =>
      d
        ? appointments.filter(
          (a) =>
            new Date(a.startTime).toISOString().split('T')[0] === d.fullDate.toISOString().split('T')[0]
        )
        : [],
    [d, appointments]
  )

  return (
    <>
      <AppointmentDetailSheet 
        appointment={selectedAppointment}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        shopId={shopId}
        businessType={businessType}
        services={services}
        staff={staff}
      />

      {/* Desktop: 7-column grid */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
        <div className="grid min-w-[840px] grid-cols-7">
          {/* Day headers */}
          {dates.map((d, i) => (
            <div
              key={d.label}
              className={cn(
                "border-b border-border px-3 py-3 text-center",
                i < 6 && "border-r border-border",
                d.isToday && "bg-primary/5"
              )}
            >
              <p className="text-xs text-muted-foreground">{d.label}</p>
              <p className={cn(
                "mt-1 text-lg font-bold",
                d.isToday ? "text-primary" : "text-card-foreground"
              )}>
                {d.day}
              </p>
            </div>
          ))}

          {/* Day columns */}
          {dates.map((d, dayIndex) => {
            const dayAppts = appointments.filter((a) =>
              new Date(a.startTime).toISOString().split('T')[0] === d.fullDate.toISOString().split('T')[0]
            )
            return (
              <div
                key={d.label + "-col"}
                className={cn(
                  "min-h-[400px] p-2",
                  dayIndex < 6 && "border-r border-border",
                  d.isToday && "bg-primary/5"
                )}
              >
                {dayAppts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground text-pretty">Sin {t.appointmentPlural.toLowerCase()}</p>
                ) : (
                  <div className="grid gap-2">
                    {dayAppts.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => handleCardClick(apt)}
                        className="group relative rounded-lg border border-border bg-secondary/30 p-2.5 transition-all hover:bg-secondary/50 hover:border-primary/50 cursor-pointer active:scale-[0.98]"
                      >
                        <p className="font-mono text-[10px] font-bold text-primary">
                          {formatTime(apt.startTime)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-card-foreground line-clamp-1">{apt.customer?.name || apt.customerName || t.client}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{apt.services?.length > 0 ? apt.services.map((s: any) => s.name).join(', ') : apt.service?.name}</p>
                        <div className="mt-2 block w-full" onClick={(e) => e.stopPropagation()}>
                          <AppointmentActions 
                            appointmentId={apt.id} 
                            shopId={shopId} 
                            currentStatus={apt.status} 
                            startTime={apt.startTime}
                            className="w-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Single-day view with navigation */}
      <div className="md:hidden">
        {/* Day selector */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-1.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              disabled={selectedDay === 0}
              onClick={() => setSelectedDay((prev) => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {dates.map((day, i) => (
                <button
                  key={day.label}
                  onClick={() => setSelectedDay(i)}
                  className={cn(
                    "flex min-w-11 h-12 flex-col items-center justify-center rounded-xl text-xs font-medium transition-all active:scale-95",
                    i === selectedDay
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10"
                      : day.isToday
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <span className="text-[8px] uppercase font-bold leading-none opacity-70">{day.label.slice(0, 3)}</span>
                  <span className="mt-1 text-sm font-black leading-none">{day.day}</span>
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              disabled={selectedDay === dates.length - 1}
              onClick={() => setSelectedDay((prev) => Math.min(dates.length - 1, prev + 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Selected day content */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Day header */}
          <div className={cn(
            "flex items-center justify-between px-5 py-4 border-b border-border",
            d?.isToday ? "bg-primary/5" : "bg-muted/10"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl font-black text-xl shadow-sm",
                d?.isToday
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-card-foreground border border-border"
              )}>
                {d?.day}
              </div>
              <div>
                <p className={cn(
                  "font-bold text-lg leading-tight tracking-tight",
                  d?.isToday ? "text-primary" : "text-card-foreground"
                )}>
                  {d?.label}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {dayAppts.length === 0
                    ? `Sin ${t.appointmentPlural.toLowerCase()} para hoy`
                    : `${dayAppts.length} ${dayAppts.length > 1 ? t.appointmentPlural.toLowerCase() : t.appointment.toLowerCase()} programada${dayAppts.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </div>

          {/* Appointments list */}
          {dayAppts.length === 0 ? (
            <div className="py-20 text-center px-6">
              <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <ChevronRight className="h-8 w-8 opacity-20 rotate-90" />
              </div>
              <p className="text-muted-foreground font-medium">No hay {t.appointmentPlural.toLowerCase()} para este día</p>
              <p className="text-xs text-muted-foreground/60 mt-1">¡Un día tranquilo siempre es bueno!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {dayAppts.map((apt) => (
                <div 
                  key={apt.id} 
                  onClick={() => handleCardClick(apt)}
                  className="flex items-center gap-4 px-5 py-5 group transition-colors hover:bg-muted/5 cursor-pointer active:bg-muted/10"
                >
                  <div className="flex flex-col items-center justify-center min-w-14 h-12 rounded-xl bg-primary/5 border border-primary/10 transition-colors group-hover:bg-primary/10">
                    <span className="font-mono text-xs font-bold leading-none text-primary">
                      {formatTime(apt.startTime).split(' ')[0]}
                    </span>
                    <span className="text-[9px] uppercase font-black mt-1 text-primary opacity-70">
                      {formatTime(apt.startTime).split(' ')[1]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-card-foreground truncate leading-tight">
                      {apt.customer?.name || apt.customerName || t.client}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{apt.services?.length > 0 ? apt.services.map((s: any) => s.name).join(', ') : apt.service?.name}</p>
                  </div>
                  <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <AppointmentActions 
                      appointmentId={apt.id} 
                      shopId={shopId} 
                      currentStatus={apt.status} 
                      startTime={apt.startTime}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
