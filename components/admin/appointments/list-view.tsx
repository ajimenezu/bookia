import { User } from "lucide-react"
import { StatusBadge } from "./status-badge"

interface ListViewProps {
  appointments: any[]
}

export function ListView({ appointments }: ListViewProps) {
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
                      {aptDate.toLocaleDateString("es-ES", { weekday: "short" })}
                    </p>
                    <p className="text-sm font-bold text-card-foreground">{aptDate.getDate()}</p>
                  </div>
                  <span className="w-12 shrink-0 font-mono text-sm font-bold text-primary">
                    {aptDate.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                  <div>
                    <p className="font-semibold text-card-foreground">{apt.customer?.name || "Cliente"}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/70">{apt.service?.name}</span> &middot; <User className="mb-0.5 inline h-3 w-3" /> {apt.staff?.name || "Staff"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-16 sm:pl-0">
                  <StatusBadge status={apt.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
