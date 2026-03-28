import { Calendar, Bell, DollarSign } from "lucide-react"

const benefits = [
  {
    icon: Calendar,
    title: "Agenda organizada",
    description: "Gestiona todas tus citas en un solo lugar. Vista diaria, semanal y mensual con asignación automática de barberos.",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    description: "Envía recordatorios por WhatsApp a tus clientes automáticamente. Reduce las cancelaciones hasta un 60%.",
  },
  {
    icon: DollarSign,
    title: "Control de ingresos",
    description: "Monitorea tus ingresos diarios, semanales y mensuales. Reportes detallados por barbero y servicio.",
  },
]

export function BenefitsSection() {
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Todo lo que necesitas para gestionar tu barbería
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Herramientas diseñadas específicamente para barberías profesionales
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/40"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-card-foreground">
                {benefit.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
