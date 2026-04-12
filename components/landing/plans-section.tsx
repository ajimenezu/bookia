"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackCtaClick, trackPlanClick } from "@/lib/analytics"

interface Plan {
  name: string
  subtitle: string
  monthlyPrice: number
  highlight?: boolean
  features: string[]
}

const plans: Plan[] = [
  {
    name: "Starter",
    subtitle: "Para equipos que inician su digitalización",
    monthlyPrice: 29,
    features: [
      "Hasta 3 miembros del equipo",
      "Agenda y reservas en línea",
      "Panel administrativo esencial",
      "Recordatorios automáticos (Solo Email)",
    ],
  },
  {
    name: "Growth",
    subtitle: "Para negocios en etapa de crecimiento",
    monthlyPrice: 59,
    highlight: true,
    features: [
      "Hasta 8 miembros del equipo",
      "Reportes de rendimiento e ingresos",
      "Gestión de descansos y ausencias",
      "Recordatorios por WhatsApp incluidos",
    ],
  },
  {
    name: "Scale",
    subtitle: "Para operaciones con alta demanda",
    monthlyPrice: 99,
    features: [
      "Miembros del equipo ilimitados",
      "Multi-sucursal y roles avanzados",
      "Conecta tu propio número de WhatsApp",
      "Acompañamiento de onboarding VIP",
    ],
  },
]

type BillingCycle = "monthly" | "yearly"

export function PlansSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly")

  const pricingLabel = useMemo(
    () => (billingCycle === "yearly" ? "/año" : "/mes"),
    [billingCycle],
  )

  function getDisplayedPrice(monthlyPrice: number) {
    if (billingCycle === "monthly") return `$${monthlyPrice}`

    // Mock annual pricing: pay 10 months, get 2 free
    return `$${monthlyPrice * 10}`
  }

  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_right,var(--primary)_0%,transparent_45%)] opacity-10" />
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Planes anuales y mensuales
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Elige el plan ideal para tu negocio
          </h2>
          <p className="mt-4 text-muted-foreground">
            Elige el plan que mejor se adapte a tu negocio y empieza hoy a convertir más reservas en ingresos reales.
          </p>
          <div className="mt-6 inline-flex items-center rounded-full border border-border bg-card/80 p-1">
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensual
            </button>
          </div>
          {billingCycle === "yearly" ? (
            <p className="mt-3 text-xs font-medium text-primary">Ahorras 2 meses con facturación anual</p>
          ) : (
            <p className="mt-3 text-xs font-medium text-muted-foreground/0">&nbsp;</p>
          )}
          <p className="mt-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">
            Los precios están expresados en USD
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative rounded-2xl border p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? "border-primary/60 bg-card"
                  : "border-border bg-card/80"
              }`}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Recomendado
                </span>
              ) : null}

              <h3 className="text-xl font-bold text-card-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</p>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight text-foreground">{getDisplayedPrice(plan.monthlyPrice)}</span>
                <span className="mb-1 text-sm text-muted-foreground">{pricingLabel}</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground/60">Precios no incluyen IVA</p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="mt-8 h-11 w-full rounded-full"
                variant={plan.highlight ? "default" : "secondary"}
              >
                <Link
                  href="/schedule"
                  onClick={() => {
                    trackPlanClick(plan.name, billingCycle)
                    trackCtaClick("start-trial", "plans")
                  }}
                >
                  Probar {plan.name}
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
