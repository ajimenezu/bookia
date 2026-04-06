"use client"

import Link from "next/link"
import {
  MapPin,
  Phone,
  Instagram,
  Facebook,
  Clock,
  ChevronDown,
  Scissors,
  Sparkles,
  Star
} from "lucide-react"
import { getTerminology } from "@/lib/dictionaries"
import type { BusinessType } from "@/lib/dictionaries"
import { ShopNavbar } from "./shop-navbar"

interface ServiceData {
  id: string
  name: string
  price: number
  duration: number
  description: string | null
}

interface StaffData {
  id: string
  name: string
}

interface ShopData {
  id: string
  name: string
  slug: string
  businessType: BusinessType
  logoUrl: string | null
  tagline: string | null
  description: string | null
  address: string | null
  whatsappPhone: string | null
  instagramUrl: string | null
  facebookUrl: string | null
}

interface ShopLandingProps {
  shop: ShopData
  services: ServiceData[]
  staff: StaffData[]
  user?: {
    name?: string | null
    phone?: string | null
  } | null
  role?: string | null
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" })
    .format(price)
    .replace("CRC", "₡")
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function ShopLanding({ shop, services, staff, user, role }: ShopLandingProps) {
  const t = getTerminology(shop.businessType)

  const whatsappHref = shop.whatsappPhone
    ? `https://wa.me/${shop.whatsappPhone.replace(/\D/g, "")}`
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── NAVBAR ─── */}
      <ShopNavbar shop={shop} user={user} role={role || undefined} showScheduleButton={true} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 opacity-5">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary" />
        </div>

        <div className="mx-auto max-w-5xl px-4 py-20 md:py-28">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* Badge */}
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t.servicePlural} profesionales
            </div>

            {/* Name */}
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
              {shop.name}
            </h1>

            {/* Tagline */}
            {shop.tagline && (
              <p className="max-w-xl text-xl text-muted-foreground md:text-2xl">
                {shop.tagline}
              </p>
            )}

            {/* Description */}
            {shop.description && (
              <p className="max-w-2xl text-base text-muted-foreground">
                {shop.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href={`/${shop.slug}/schedule`}
                id="hero-book-btn"
                className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 flex items-center justify-center"
              >
                Reservar cita
              </Link>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="hero-whatsapp-btn"
                  className="h-12 rounded-xl border border-border bg-card px-8 text-base font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-card/80"
                >
                  WhatsApp
                </a>
              )}
            </div>

            {/* Social & Address pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              {shop.address && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {shop.address}
                </span>
              )}
              {shop.instagramUrl && (
                <a
                  href={shop.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  Instagram
                </a>
              )}
              {shop.facebookUrl && (
                <a
                  href={shop.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <Facebook className="h-3.5 w-3.5" />
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center pb-6">
          <ChevronDown className="h-5 w-5 animate-bounce text-muted-foreground" />
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section id="services-section" className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Nuestros {t.servicePlural}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Elige el {t.service.toLowerCase()} que mejor se adapta a ti
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Link
              key={svc.id}
              href={`/${shop.slug}/schedule`}
              id={`service-${svc.id}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Scissors className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(svc.price)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-card-foreground">{svc.name}</p>
                {svc.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {svc.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(svc.duration)}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── STAFF PREVIEW ─── */}
      {staff.length > 0 && (
        <section className="border-t border-border bg-card/50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold md:text-3xl">
                Nuestro equipo
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t.staffPlural} listos para atenderte
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <p className="text-sm font-medium text-card-foreground">
                    {member.name}
                  </p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="h-3 w-3 fill-primary text-primary"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-card-foreground">{shop.name}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {shop.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {shop.address}
              </span>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <Phone className="h-3.5 w-3.5" />
                {shop.whatsappPhone}
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            {shop.instagramUrl && (
              <a
                href={shop.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {shop.facebookUrl && (
              <a
                href={shop.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <Link href="/" className="text-primary hover:underline">
                ExcaliTech
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
