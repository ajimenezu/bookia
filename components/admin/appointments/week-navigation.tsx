"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface WeekNavigationProps {
  weekOffset: number
  view: string
  rangeLabel: string
}

export function WeekNavigation({ weekOffset, view, rangeLabel }: WeekNavigationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = (newOffset: number) => {
    startTransition(() => {
      router.push(`?week=${newOffset}&view=${view}`, { scroll: false })
    })
  }

  return (
    <div className={`mb-6 flex items-center justify-between transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate(weekOffset - 1)}
        disabled={isPending}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <h2 className="text-sm font-medium text-muted-foreground select-none">
        {rangeLabel}
      </h2>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate(weekOffset + 1)}
        disabled={isPending}
        className="h-9 w-9"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
