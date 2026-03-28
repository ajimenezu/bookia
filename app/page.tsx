import { LandingNav } from "@/components/landing/landing-nav"
import { HeroSection } from "@/components/landing/hero-section"
import { BenefitsSection } from "@/components/landing/benefits-section"
import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <HeroSection />
        <div id="beneficios">
          <BenefitsSection />
        </div>
        <div id="demo">
          <DashboardPreview />
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
