"use client"

import { DollarSign, TrendingUp } from "lucide-react"

interface AdminStatsProps {
  totalRevenue: string | number
  totalBookings: number
}

export function AdminStats({ totalRevenue, totalBookings }: AdminStatsProps) {
  // Ensure we have a string representation for revenue
  const formattedRevenue = typeof totalRevenue === "number"
    ? new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(totalRevenue).replace("CRC", "₡")
    : totalRevenue

  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-2">
      <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <DollarSign className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Ingreso total (este mes)</p>
          <p className="text-2xl font-bold text-card-foreground tracking-tight">{formattedRevenue}</p>
        </div>
      </div>
      
      <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Reservas totales (este mes)</p>
          <p className="text-2xl font-bold text-card-foreground tracking-tight">{totalBookings}</p>
        </div>
      </div>
    </div>
  )
}
