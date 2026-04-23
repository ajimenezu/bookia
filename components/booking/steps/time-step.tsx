"use client"

import { Dispatch, SetStateAction } from "react"

import { CalendarDays, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getAvailableStaffForSlot } from "@/app/schedule/actions"

interface TimeStepProps {
  selectedDate: Date | undefined
  loadingSlots: boolean
  availableSlots: string[]
  selectedTime: string | null
  setSelectedTime: Dispatch<SetStateAction<string | null>>
  selectedBarber: string | null
  shopId: string
  selectedServices: string[]
  setAssignedAutoStaff: Dispatch<SetStateAction<{ id: string; name: string } | null>>
  setLoadingStaff: Dispatch<SetStateAction<boolean>>
  setBookingError: Dispatch<SetStateAction<string | null>>
  setSelectedDate: Dispatch<SetStateAction<Date | undefined>>
  setAvailableSlots: Dispatch<SetStateAction<string[]>>
  t: any
}

export function TimeStep({
  selectedDate,
  loadingSlots,
  availableSlots,
  selectedTime,
  setSelectedTime,
  selectedBarber,
  shopId,
  selectedServices,
  setAssignedAutoStaff,
  setLoadingStaff,
  setBookingError,
  setSelectedDate,
  setAvailableSlots,
  t
}: TimeStepProps) {
  return (
    <section className="animate-in fade-in slide-in-from-right-4 duration-500 px-4 sm:px-6">
      <h2 className="mb-2 text-xl font-black text-foreground tracking-tight">Elige el horario</h2>
      <div className="mb-8 flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 w-fit">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span className="text-xs font-black uppercase text-primary tracking-widest">
          {selectedDate?.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
        </span>
      </div>

      {loadingSlots ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-3xl border border-dashed border-border/80">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
          <span className="mt-4 text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">Buscando espacios...</span>
        </div>
      ) : availableSlots.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {availableSlots.map((time) => (
            <button
              key={time}
              onClick={async () => {
                setSelectedTime(time)
                if (selectedBarber === "auto") {
                  setLoadingStaff(true)
                  try {
                    const dateStr = `${selectedDate!.getFullYear()}-${String(selectedDate!.getMonth() + 1).padStart(2, '0')}-${String(selectedDate!.getDate()).padStart(2, '0')}`
                    const availableStaff = await getAvailableStaffForSlot(shopId, dateStr, time, selectedServices)
                    if (availableStaff.length > 0) {
                      const randomStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)]
                      setAssignedAutoStaff(randomStaff)
                    } else {
                      setBookingError("Lo sentimos, este horario acaba de ser ocupado. Intenta otro.")
                      setSelectedTime(null)
                    }
                  } catch (e) {
                    console.error(e)
                  } finally {
                    setLoadingStaff(false)
                  }
                } else {
                  setAssignedAutoStaff(null)
                }
              }}
              className={cn(
                "rounded-2xl border px-4 py-4 text-base font-black transition-all cursor-pointer shadow-sm active:scale-90",
                selectedTime === time
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10"
                  : "border-border bg-card text-card-foreground hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              {time}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/80 bg-muted/5 p-12 text-center">
          <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-muted/20 flex items-center justify-center">
            <span className="text-2xl">🌙</span>
          </div>
          <p className="font-bold text-muted-foreground">No hay espacios disponibles</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Intenta con otra {t.appointment.toLowerCase() === 'turno' ? 'fecha' : 'fecha'}</p>
        </div>
      )}

      <Button
        variant="outline"
        className="mt-8 w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border-border/60 shadow-sm"
        onClick={() => { setSelectedDate(undefined); setSelectedTime(null); setAvailableSlots([]) }}
      >
        Volver
      </Button>
    </section>
  )
}
