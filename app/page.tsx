import type { Metadata } from "next"
import { LandingNav } from "@/components/landing/landing-nav"
import { HeroSection } from "@/components/landing/hero-section"
import { BenefitsSection } from "@/components/landing/benefits-section"
import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { PlansSection } from "@/components/landing/plans-section"
import { FaqSection } from "@/components/landing/faq-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export const metadata: Metadata = {
  title: "BookIA | Plataforma de reservas para negocios de servicios",
  description:
    "BookIA centraliza agenda, recordatorios automáticos y operación diaria para barberías, salones, spa y clínicas.",
  keywords: [
    "software de reservas",
    "agenda online",
    "bookia",
    "barberia",
    "salon de belleza",
    "spa",
    "clinica",
    "recordatorios whatsapp",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BookIA | Reservas y operación en una sola plataforma",
    description:
      "Gestiona reservas, clientes, equipo e ingresos con una experiencia premium y multi-tenant.",
    type: "website",
    url: "/",
    siteName: "BookIA",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookIA | Reservas y operación en una sola plataforma",
    description:
      "Transforma la experiencia de reserva de tu negocio con automatización y control en tiempo real.",
  },
}

const productSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BookIA",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Plataforma para gestionar reservas, clientes y recordatorios automáticos en negocios de servicios.",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "29",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "59",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: "Scale",
      price: "99",
      priceCurrency: "USD",
    },
  ],
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <HeroSection />
        <div id="beneficios">
          <BenefitsSection />
        </div>
        <div id="demo">
          <DashboardPreview />
        </div>
        <div id="planes">
          <PlansSection />
        </div>
        <div id="faq">
          <FaqSection />
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
