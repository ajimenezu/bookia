import Link from "next/link"
import { MapPinOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass-card animate-in fade-in zoom-in duration-300 flex max-w-md flex-col items-center justify-center space-y-6 rounded-xl border border-border/50 bg-background/50 p-8 text-center backdrop-blur-md shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent/50 text-accent-foreground">
          <MapPinOff className="size-8" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Página no encontrada
          </h1>
          <p className="text-sm text-muted-foreground">
            Lo sentimos, no pudimos encontrar la página que estás buscando. Puede que el enlace sea incorrecto o la página haya sido eliminada.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/">
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  )
}
