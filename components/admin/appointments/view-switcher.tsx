"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
        variant="ghost"
        size="sm"
        onClick={() => handleSwitch("calendar")}
        disabled={isPending}
        className={cn(
          "rounded-xl h-9 px-4 font-bold transition-all shadow-sm border",
          currentView === "calendar" 
            ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/90" 
            : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 hover:border-primary/40",
          isPending && currentView !== "calendar" && "opacity-50"
        )}
      >
        <CalendarDays className="mr-1.5 h-4 w-4" />
        <span className="md:hidden">Día</span>
        <span className="hidden md:inline">Semana</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSwitch("list")}
        disabled={isPending}
        className={cn(
          "rounded-xl h-9 px-4 font-bold transition-all shadow-sm border",
          currentView === "list" 
            ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/90" 
            : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 hover:border-primary/40",
          isPending && currentView !== "list" && "opacity-50"
        )}
      >
        <List className="mr-1.5 h-4 w-4" /> Lista
      </Button>
    </div>
  )
}
