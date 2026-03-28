import { Scissors } from "lucide-react"
import Link from "next/link"

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-foreground">BookIA</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#beneficios" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Beneficios
          </Link>
          <Link href="#demo" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Demo
          </Link>
          <Link href="/admin" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Panel Admin
          </Link>
        </nav>
        <Link
          href="/schedule"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Probar Gratis
        </Link>
      </div>
    </header>
  )
}
