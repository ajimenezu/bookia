import { CalendarDays, BadgeCent, User, CheckCircle2 } from "lucide-react"
import { StatusBadge } from "@/components/admin/appointments/status-badge"
import { formatTime } from "@/lib/date-utils"

export async function DashboardPreview() {
  const appointmentsData: any[] = [

    {
      id: "1",
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      customer: { name: "Juan Pérez" },
      service: { name: "Corte de Cabello", price: 12000 },
      staff: { name: "Marco" },
      status: "CONFIRMED"
    },
    {
      id: "2",
      startTime: new Date(new Date().setHours(11, 30, 0, 0)),
      customer: { name: "Andrés M." },
      service: { name: "Barba & Ritual", price: 8000 },
      staff: { name: "Elena" },
      status: "PENDING"
    },
    {
      id: "3",
      startTime: new Date(new Date().setHours(15, 0, 0, 0)),
      customer: { name: "Roberto R." },
      service: { name: "Corte Senior", price: 10000 },
      staff: { name: "Marco" },
      status: "COMPLETED"
    }
  ]



  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Un panel diseñado para la eficiencia
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Visualiza tus citas, ingresos y clientes en un panel intuitivo
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-primary/5 md:p-6">
          {/* Stats row */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl bg-secondary/50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Citas hoy</p>
                <p className="text-2xl font-bold text-card-foreground">{appointmentsData.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-secondary/50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BadgeCent className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingreso estimado</p>
                <p className="text-2xl font-bold text-card-foreground">
                  ₡{appointmentsData.reduce((acc, curr) => acc + (curr.service?.price || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-secondary/50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Citas totales</p>
                <p className="text-2xl font-bold text-card-foreground">{appointmentsData.length}</p>
              </div>
            </div>
          </div>

          {/* Appointments list */}
          <div className="space-y-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>Citas registradas</span>
            </div>
            {appointmentsData.length === 0 ? (
              <div className="rounded-xl bg-secondary/10 py-8 text-center text-muted-foreground">
                No hay citas programadas aún.
              </div>
            ) : (
              appointmentsData.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col gap-3 rounded-xl bg-secondary/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-14 shrink-0 text-sm font-mono font-medium text-primary">
                      {formatTime(apt.startTime)}
                    </span>
                    <div>
                      <p className="font-medium text-card-foreground">{apt.customer?.name || "Cliente"}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.service?.name} &middot; {apt.staff?.name || "Staff"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
