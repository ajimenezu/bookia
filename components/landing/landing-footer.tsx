import { Scissors } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-foreground">BookIA</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 BookIA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
