"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BrandMark } from "@/components/landing/brand-mark"
import { trackCtaClick } from "@/lib/analytics"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
          <BrandMark className="h-4 w-4 rounded-sm" size={16} />
          <span>Reservas inteligentes para negocios de servicios</span>
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Gestiona reservas, clientes y operacion desde un solo lugar
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          BookIA simplifica la agenda diaria para barberias, salones, spa y clinicas con automatizaciones y control en tiempo real.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full px-8 text-base font-semibold">
            <Link
              href="/demo"
              onClick={() => trackCtaClick("schedule-demo", "hero")}
            >
              Agendar Demo
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
