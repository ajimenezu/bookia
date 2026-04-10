import { User } from "lucide-react"
import { StatusBadge } from "./status-badge"
import { formatTime, formatDate } from "@/lib/date-utils"
import { AppointmentActions } from "./appointment-actions"

interface ListViewProps {
  appointments: any[]
  shopId: string
}

export function ListView({ appointments, shopId }: ListViewProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {appointments.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No hay citas registradas para esta semana.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {appointments.map((apt) => {
            const aptDate = new Date(apt.startTime)
            return (
              <div
                key={apt.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-secondary/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">
                      {new Date(apt.startTime).toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" })}
                    </p>
                    <p className="text-sm font-bold text-card-foreground">
                      {new Date(apt.startTime).toLocaleDateString("es-ES", { day: "2-digit", timeZone: "UTC" })}
                    </p>
                  </div>
                  <span className="w-12 shrink-0 font-mono text-sm font-bold text-primary">
                    {formatTime(apt.startTime)}
                  </span>
                  <div>
                    <p className="font-semibold text-card-foreground">{apt.customer?.name || "Cliente"}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/70">{apt.services?.length > 0 ? apt.services.map((s: any) => s.name).join(', ') : apt.service?.name}</span> &middot; <User className="mb-0.5 inline h-3 w-3" /> {apt.staff?.name || "Staff"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-16 sm:pl-0">
                  <AppointmentActions 
                    appointmentId={apt.id} 
                    shopId={shopId} 
                    currentStatus={apt.status} 
                    startTime={apt.startTime}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
