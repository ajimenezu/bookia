"use client"

import { Dispatch, SetStateAction } from "react"

import { UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StaffData {
  id: string
  name: string
}

interface StaffStepProps {
  allStaff: StaffData[]
  selectedBarber: string | null
  setSelectedBarber: Dispatch<SetStateAction<string | null>>
  setIsServiceStepDone: Dispatch<SetStateAction<boolean>>
  t: any
}

export function StaffStep({
  allStaff,
  selectedBarber,
  setSelectedBarber,
  setIsServiceStepDone,
  t
}: StaffStepProps) {
  return (
    <section className="animate-in fade-in slide-in-from-right-4 duration-500 px-4 sm:px-6">
      <h2 className="mb-6 text-xl font-black text-foreground tracking-tight">Elige {t.staffGender === "f" ? "una" : "un"} {t.staff}</h2>
      <div className="grid gap-4">
        {allStaff.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBarber(b.id)}
            className={cn(
              "flex items-center gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all cursor-pointer shadow-sm active:scale-[0.98] w-full",
              selectedBarber === b.id
                ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            {b.id === "auto" ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse">
                <UserCheck className="h-7 w-7" />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-black text-secondary-foreground shadow-inner border border-border/40 uppercase">
                {b.name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("")}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-card-foreground text-lg leading-tight truncate">{b.name}</p>
              {b.id === "auto" && (
                <p className="text-xs font-medium text-muted-foreground mt-1">{t.staffGender === "f" ? "Primera" : "Primer"} {t.staff} disponible</p>
              )}
            </div>
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        className="mt-6 w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border-border/60"
        onClick={() => { setIsServiceStepDone(false); setSelectedBarber(null) }}
      >
        Volver
      </Button>
    </section>
  )
}
