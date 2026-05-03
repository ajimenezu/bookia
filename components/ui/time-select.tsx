"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { convertTo12h } from "@/lib/date-utils"

interface TimeSelectProps {
  value: string | null
  onChange: (val: string) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function TimeSelect({ 
  value, 
  onChange, 
  label, 
  disabled = false,
  className
}: TimeSelectProps) {
  const times = React.useMemo(() => {
    const t = []
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        t.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
      }
    }
    return t
  }, [])

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && <Label className="text-xs">{label}</Label>}
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-background/50 backdrop-blur-sm border-border shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Seleccionar hora" />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] bg-popover/95 backdrop-blur-md border-border shadow-xl">
          {times.map((t) => (
            <SelectItem key={t} value={t} className="text-sm">
              {convertTo12h(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
