"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"

interface CalendarViewProps {
  dates: any[]
  appointments: any[]
}

export function CalendarView({ dates, appointments }: CalendarViewProps) {
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

  const d = dates[selectedDay]
  const dayAppts = useMemo(
    () =>
      d
        ? appointments.filter(
          (a) =>
            new Date(a.startTime).toDateString() === d.fullDate.toDateString()
        )
        : [],
    [d, appointments]
  )

  return (
    <>
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
              new Date(a.startTime).toDateString() === d.fullDate.toDateString()
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
                  <p className="py-4 text-center text-xs text-muted-foreground text-pretty">Sin citas</p>
                ) : (
                  <div className="grid gap-2">
                    {dayAppts.map((apt) => (
                      <div
                        key={apt.id}
                        className="group relative rounded-lg border border-border bg-secondary/30 p-2.5 transition-colors hover:bg-secondary/50"
                      >
                        <p className="font-mono text-[10px] font-bold text-primary">
                          {new Date(apt.startTime).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-card-foreground line-clamp-1">{apt.customer?.name || apt.customerName || "Cliente"}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{apt.services?.length > 0 ? apt.services.map((s: any) => s.name).join(', ') : apt.service?.name}</p>
                        <div className="mt-2">
                          <StatusBadge status={apt.status} />
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
        <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card px-2 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={selectedDay === 0}
            onClick={() => setSelectedDay((prev) => Math.max(0, prev - 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            {dates.map((day, i) => (
              <button
                key={day.label}
                onClick={() => setSelectedDay(i)}
                className={cn(
                  "flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors",
                  i === selectedDay
                    ? "bg-primary text-primary-foreground"
                    : day.isToday
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <span className="text-[9px] uppercase leading-none">{day.label.slice(0, 3)}</span>
                <span className="mt-0.5 text-sm font-bold leading-none">{day.day}</span>
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={selectedDay === dates.length - 1}
            onClick={() => setSelectedDay((prev) => Math.min(dates.length - 1, prev + 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Selected day content */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Day header */}
          <div className={cn(
            "flex items-center justify-between px-4 py-3 border-b border-border",
            d?.isToday ? "bg-primary/10" : "bg-secondary/30"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg font-bold text-lg",
                d?.isToday
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-card-foreground"
              )}>
                {d?.day}
              </div>
              <div>
                <p className={cn(
                  "font-semibold",
                  d?.isToday ? "text-primary" : "text-card-foreground"
                )}>
                  {d?.label}
                </p>
                {d?.isToday && (
                  <p className="text-xs font-medium text-primary/70">Hoy</p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {dayAppts.length === 0
                ? "Sin citas"
                : `${dayAppts.length} cita${dayAppts.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Appointments list */}
          {dayAppts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">No hay citas para este día</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {dayAppts.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="w-12 shrink-0 font-mono text-sm font-bold text-primary">
                    {new Date(apt.startTime).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-card-foreground truncate">
                      {apt.customer?.name || apt.customerName || "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{apt.services?.length > 0 ? apt.services.map((s: any) => s.name).join(', ') : apt.service?.name}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
