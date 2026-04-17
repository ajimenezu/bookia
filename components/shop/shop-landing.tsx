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
import { getBusinessIcon } from "@/lib/business-icons"

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
  const BusinessIcon = getBusinessIcon(shop.businessType)

  const whatsappHref = shop.whatsappPhone
    ? `https://wa.me/${shop.whatsappPhone.replace(/\D/g, "")}`
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── NAVBAR ─── */}
      <ShopNavbar shop={shop} user={user} role={role || undefined} showScheduleButton={true} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Background animation & blobs */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,var(--primary-muted)_0%,transparent_50%)] opacity-30" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,var(--primary-muted)_0%,transparent_50%)] opacity-20" />
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />

        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-8 text-center">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary animate-in fade-in slide-in-from-top-4 duration-700">
              <Sparkles className="h-3.5 w-3.5" />
              {t.businessName} de Excelencia
            </div>

            {/* Name & Tagline */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <h1 className="text-5xl font-black tracking-tighter md:text-8xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight pb-2">
                {shop.name}
              </h1>
              {shop.tagline && (
                <p className="mx-auto max-w-xl text-xl font-bold text-muted-foreground/80 md:text-3xl leading-tight">
                  {shop.tagline}
                </p>
              )}
            </div>

            {/* Description */}
            {shop.description && (
              <p className="max-w-2xl text-base font-medium text-muted-foreground/60 leading-relaxed animate-in fade-in duration-1000 delay-300">
                {shop.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
              <Link
                href={`/${shop.slug}/schedule`}
                id="hero-book-btn"
                className="h-16 rounded-[2rem] bg-primary px-10 text-lg font-black uppercase tracking-widest text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/40 active:scale-95 flex items-center justify-center"
              >
                {t.bookVerb} Ahora
              </Link>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="hero-whatsapp-btn"
                  className="h-16 rounded-[2rem] border-2 border-border bg-card/50 backdrop-blur-md px-10 text-lg font-black uppercase tracking-widest text-foreground transition-all hover:bg-card hover:border-primary/40 flex items-center justify-center gap-2"
                >
                  <Phone className="h-5 w-5" />
                  WhatsApp
                </a>
              )}
            </div>

            {/* Social & Address pills */}
            <div className="flex flex-wrap justify-center gap-5 pt-6 animate-in fade-in duration-1000 delay-700">
              {shop.address && (
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  {shop.address}
                </div>
              )}
              <div className="flex gap-4">
                {shop.instagramUrl && (
                  <a
                    href={shop.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:scale-110"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {shop.facebookUrl && (
                  <a
                    href={shop.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:scale-110"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center pb-6 border-t border-border/10 pt-6">
          <ChevronDown className="h-5 w-5 animate-bounce text-muted-foreground" />
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section id="services-section" className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center space-y-3">
          <h2 className="text-3xl font-black md:text-5xl tracking-tight">
            {t.serviceGender === "f" ? "Nuestras" : "Nuestros"} {t.servicePlural}
          </h2>
          <p className="mx-auto max-w-lg text-lg font-medium text-muted-foreground/60 leading-relaxed">
            Personaliza tu experiencia eligiendo entre {t.serviceGender === "f" ? "nuestras" : "nuestros"} {t.servicePlural.toLowerCase()} {t.serviceGender === "f" ? "exclusivas" : "exclusivos"}.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Link
              key={svc.id}
              href={`/${shop.slug}/schedule?service=${svc.id}`}
              id={`service-${svc.id}`}
              className="group flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 text-left transition-all hover:border-primary/40 hover:shadow-2xl hover:-translate-y-2 cursor-pointer relative overflow-hidden active:scale-95 h-full"
            >
              <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
              
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-12 group-hover:scale-110 shadow-inner">
                  <BusinessIcon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Precio</p>
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    {formatPrice(svc.price)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 flex-1">
                <p className="text-xl font-black text-card-foreground leading-tight">{svc.name}</p>
                {svc.description && (
                  <p className="text-sm font-medium text-muted-foreground/70 leading-relaxed whitespace-pre-wrap">
                    {svc.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                  <Clock className="h-4 w-4" />
                  {formatDuration(svc.duration)}
                </div>
                <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── STAFF PREVIEW ─── */}
      {staff.length > 0 && (
        <section className="border-t border-border bg-card/50 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center space-y-3">
              <h2 className="text-3xl font-black md:text-5xl tracking-tight">
                {t.staffGender === "f" ? "Nuestra" : "Nuestro"} {t.staff.toLowerCase()}
              </h2>
              <p className="mx-auto max-w-lg text-lg font-medium text-muted-foreground/60 leading-relaxed">
                Expertos dedicados a brindarte el mejor servicio.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-10">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center gap-4 group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-0 group-hover:scale-125 transition-transform duration-500" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary text-2xl font-black text-secondary-foreground shadow-2xl border border-border/60 transition-transform group-hover:-translate-y-2 group-hover:scale-105 duration-300">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")}
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-lg font-black text-card-foreground">
                      {member.name}
                    </p>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="h-3.5 w-3.5 fill-primary text-primary"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 py-12 flex flex-col gap-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <BusinessIcon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-black text-card-foreground tracking-tighter">{shop.name}</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground max-w-xs text-center md:text-left">
                Tu plataforma de confianza para agendar {t.appointmentPlural.toLowerCase()} de forma rápida y sencilla.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Contáctanos</p>
              <div className="flex flex-wrap justify-center gap-6">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    {shop.whatsappPhone}
                  </a>
                )}
                {shop.address && (
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {shop.address}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {shop.instagramUrl && (
                <a
                  href={shop.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {shop.facebookUrl && (
                <a
                  href={shop.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>
            
            <p className="text-sm font-medium text-muted-foreground">
              © {new Date().getFullYear()} {shop.name}. Powered by{" "}
              <Link href="/" className="text-primary font-black hover:underline underline-offset-4">
                ExcaliTech
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
