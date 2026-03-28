import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface WeekNavigationProps {
  weekOffset: number
  view: string
  rangeLabel: string
}

export function WeekNavigation({ weekOffset, view, rangeLabel }: WeekNavigationProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`?week=${weekOffset - 1}&view=${view}`}>
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </Button>
      <h2 className="text-sm font-medium text-muted-foreground">
        {rangeLabel}
      </h2>
      <Button variant="ghost" size="icon" asChild>
        <Link href={`?week=${weekOffset + 1}&view=${view}`}>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  )
}
