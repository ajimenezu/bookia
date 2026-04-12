"use client"

import Link from "next/link"
import { BrandMark } from "@/components/landing/brand-mark"
import { trackCtaClick } from "@/lib/analytics"

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/40 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <BrandMark className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-bold text-foreground">BookIA</span>
            </div>
            <Link
              href="/demo"
              onClick={() => trackCtaClick("schedule-demo", "footer")}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Agendar Demo
            </Link>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-6 text-sm text-muted-foreground md:flex-row">
            <p>Plataforma de reservas para negocios de servicios en crecimiento.</p>
            <p>&copy; 2026 BookIA. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
