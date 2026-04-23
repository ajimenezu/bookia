"use client"

import { Dispatch, SetStateAction } from "react"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { es } from "date-fns/locale"

interface StaffData {
  id: string
  name: string
}

interface DateStepProps {
  selectedDate: Date | undefined
  handleDateSelect: (date: Date | undefined) => Promise<void>
  shopSchedules: {
    dayOfWeek: number
    closeTime: string
    isOpen: boolean
  }[]
  staff: StaffData[]
  setIsServiceStepDone: Dispatch<SetStateAction<boolean>>
  setSelectedBarber: Dispatch<SetStateAction<string | null>>
  setSelectedDate: Dispatch<SetStateAction<Date | undefined>>
  setAvailableSlots: Dispatch<SetStateAction<string[]>>
}

export function DateStep({
  selectedDate,
  handleDateSelect,
  shopSchedules,
  staff,
  setIsServiceStepDone,
  setSelectedBarber,
  setSelectedDate,
  setAvailableSlots
}: DateStepProps) {
  return (
    <section className="animate-in fade-in slide-in-from-right-4 duration-500 px-4 sm:px-6">
      <h2 className="mb-6 text-xl font-black text-foreground tracking-tight">¿Cuándo vienes?</h2>
      <div className="mx-auto w-full max-w-[350px] rounded-3xl border border-border/60 bg-card p-4 shadow-xl shadow-black/5 ring-1 ring-black/5">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={es}
          disabled={(date) => {
            const crNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }))
            const isToday =
              crNow.getFullYear() === date.getFullYear() &&
              crNow.getMonth() === date.getMonth() &&
              crNow.getDate() === date.getDate()

            if (date < new Date(crNow.setHours(0, 0, 0, 0))) return true

            const daySchedule = shopSchedules.find(s => s.dayOfWeek === date.getDay())
            if (daySchedule && !daySchedule.isOpen) return true

            if (isToday) {
              const currentTime = `${new Date().toLocaleString("es-CR", { timeZone: "America/Costa_Rica", hour: '2-digit', minute: '2-digit', hour12: false })}`
              const closingTime = daySchedule?.closeTime || "20:00"
              if (currentTime >= closingTime) return true
            }

            return false
          }}
          className="w-full"
        />
      </div>
      <Button
        variant="outline"
        className="mt-6 w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border-border/60 shadow-sm"
        onClick={() => {
          if (staff.length === 1) {
            setIsServiceStepDone(false)
          } else {
            setSelectedBarber(null)
          }
          setSelectedDate(undefined)
          setAvailableSlots([])
        }}
      >
        Volver
      </Button>
    </section>
  )
}
