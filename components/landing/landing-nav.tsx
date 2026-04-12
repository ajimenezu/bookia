"use client"

import Link from "next/link"
import { BrandMark } from "@/components/landing/brand-mark"
import { trackCtaClick } from "@/lib/analytics"

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold text-foreground">BookIA</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#beneficios" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Beneficios
          </Link>
          <Link href="#demo" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Demo
          </Link>
          <Link href="#planes" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Planes
          </Link>
        </nav>
        <Link
          href="/demo"
          onClick={() => trackCtaClick("schedule-demo", "nav")}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Agendar Demo
        </Link>
      </div>
    </header>
  )
}
