"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

export function HoyButton() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const week = searchParams.get("week") || "0"
  const view = searchParams.get("view") || "calendar"
  
  // If we are already on the current week, just emit an event
  // that CalendarView can listen to instead of doing a full navigation
  const isCurrentWeek = week === "0"

  const handleHoy = () => {
    if (isCurrentWeek && view === "calendar") {
      window.dispatchEvent(new CustomEvent("reset-calendar-today"))
      return
    }

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("week", "0")
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleHoy}
      disabled={isPending}
      className={isPending ? "opacity-70" : ""}
    >
      <RotateCcw className={`mr-1.5 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      Hoy
    </Button>
  )
}
