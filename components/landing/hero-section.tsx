"use client"

import { Button } from "@/components/ui/button"
import { Scissors } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
          <Scissors className="h-4 w-4" />
          <span>Plataforma #1 para barberías</span>
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Sistema profesional de reservas para barberías
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          Organiza tu agenda, reduce cancelaciones y automatiza recordatorios por WhatsApp
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full px-8 text-base font-semibold">
            <Link href="/schedule">Ver Demo</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-full border-border px-8 text-base text-foreground hover:bg-secondary">
            <Link href="/admin">Panel Admin</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
