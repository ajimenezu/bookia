import type { Metadata } from "next"
import { DemoScheduler } from "@/components/demo/demo-scheduler"

export const metadata: Metadata = {
  title: "Agendar Demo",
  description:
    "Agenda una demostración personalizada de BookIA y conoce cómo funciona la plataforma para tu negocio.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Agendar Demo | BookIA",
    description:
      "Reserva una demo guiada para ver BookIA en acción y adaptar la experiencia a tu negocio.",
    type: "website",
    url: "/demo",
    siteName: "BookIA",
    locale: "es_ES",
  },
}

export default function DemoPage() {
  return <DemoScheduler />
}
