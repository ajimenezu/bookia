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
    <div className={`mb-6 flex items-center justify-center gap-8 sm:justify-between transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate(weekOffset - 1)}
        disabled={isPending}
        className="h-10 w-10 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 hover:border-primary/40 shadow-sm transition-all"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="flex flex-col items-center">
        <h2 className="text-sm font-bold text-foreground select-none tracking-tight">
          {rangeLabel}
        </h2>
        <div className="h-1 w-8 rounded-full bg-primary/20 mt-1" />
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate(weekOffset + 1)}
        disabled={isPending}
        className="h-10 w-10 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 hover:border-primary/40 shadow-sm transition-all"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
