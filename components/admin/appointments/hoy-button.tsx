"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export function HoyButton() {
  const searchParams = useSearchParams()
  const week = searchParams.get("week") || "0"
  const view = searchParams.get("view") || "calendar"
  
  // If we are already on the current week, just emit an event
  // that CalendarView can listen to instead of doing a full navigation
  const isCurrentWeek = week === "0"

  const handleClick = (e: React.MouseEvent) => {
    if (isCurrentWeek && view === "calendar") {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent("reset-calendar-today"))
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
    >
      <Link 
        href={`?week=0&view=${view}`}
        onClick={handleClick}
        scroll={false}
      >
        <RotateCcw className="mr-1.5 h-4 w-4" />
        Hoy
      </Link>
    </Button>
  )
}
