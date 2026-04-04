"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, List } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ViewSwitcherProps {
  currentView: "calendar" | "list"
  weekOffset: number
}

export function ViewSwitcher({ currentView, weekOffset }: ViewSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSwitch = (view: "calendar" | "list") => {
    if (view === currentView) return
    
    startTransition(() => {
      router.push(`?week=${weekOffset}&view=${view}`, { scroll: false })
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={currentView === "calendar" ? "default" : "outline"}
        size="sm"
        onClick={() => handleSwitch("calendar")}
        disabled={isPending}
        className={isPending && currentView !== "calendar" ? "opacity-50" : ""}
      >
        <CalendarDays className="mr-1.5 h-4 w-4" />
        <span className="md:hidden">Día</span>
        <span className="hidden md:inline">Semana</span>
      </Button>
      <Button
        variant={currentView === "list" ? "default" : "outline"}
        size="sm"
        onClick={() => handleSwitch("list")}
        disabled={isPending}
        className={isPending && currentView !== "list" ? "opacity-50" : ""}
      >
        <List className="mr-1.5 h-4 w-4" /> Lista
      </Button>
    </div>
  )
}
