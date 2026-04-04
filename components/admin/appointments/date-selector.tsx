"use client"

import * as React from "react"
import { format, addWeeks, startOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getWeekOffset } from "@/lib/date-utils"

export function DateSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const weekOffset = parseInt(searchParams.get("week") || "0")
  const view = searchParams.get("view") || "calendar"

  // Calculate a reference date based on weekOffset for display purposes
  // We use startOfWeek to ensure consistency with how our app views weeks (starting on Monday)
  const displayDate = React.useMemo(() => {
    const now = new Date()
    const dateInTargetWeek = addWeeks(now, weekOffset)
    return startOfWeek(dateInTargetWeek, { weekStartsOn: 1 }) // 1 = Monday
  }, [weekOffset])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      startTransition(() => {
        const newOffset = getWeekOffset(selectedDate)
        const params = new URLSearchParams(searchParams.toString())
        params.set("week", newOffset.toString())
        params.set("view", view)
        
        router.push(`?${params.toString()}`, { scroll: false })
      })
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className={cn(
            "h-9 px-3 text-left font-normal border-ring/20 hover:bg-accent hover:text-accent-foreground transition-colors",
            isPending && "opacity-70"
          )}
          id="date-picker-trigger"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">
            {format(displayDate, "PPP", { locale: es })}
          </span>
          <span className="sm:hidden">
            {format(displayDate, "dd/MM/yy")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-ring/20 shadow-xl" align="start">
        <Calendar
          mode="single"
          selected={displayDate}
          onSelect={handleSelect}
          initialFocus
          locale={es}
          className="rounded-md border-none"
        />
      </PopoverContent>
    </Popover>
  )
}
