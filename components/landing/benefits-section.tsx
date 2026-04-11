"use client"

import { Calendar, Bell, DollarSign } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { trackCtaClick } from "@/lib/analytics"

const benefits = [
  {
    icon: Calendar,
    title: "Agenda organizada",
    description: "Gestiona todas tus citas en un solo lugar con vistas claras para equipos de atencion y operacion.",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    description: "Reduce ausencias con recordatorios automaticos y mejora la puntualidad de tus clientes.",
  },
  {
    icon: DollarSign,
    title: "Control de ingresos",
    description: "Monitorea ingresos y rendimiento por servicio, profesional o unidad de negocio.",
  },
]

export function BenefitsSection() {
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Todo lo que necesitas para escalar tu operacion
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Diseñado para negocios de servicios que necesitan orden, velocidad y una experiencia premium.
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
        <div className="mt-10 flex justify-center">
          <Button asChild variant="secondary" size="lg" className="rounded-full px-8">
            <Link
              href="#planes"
              onClick={() => trackCtaClick("open-plans", "benefits")}
            >
              Ver planes
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
