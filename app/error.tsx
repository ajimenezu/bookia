"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass-card animate-in fade-in zoom-in duration-300 flex max-w-md flex-col items-center justify-center space-y-6 rounded-xl border border-border/50 bg-background/50 p-8 text-center backdrop-blur-md shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ServerCrash className="size-8" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Algo salió mal
          </h1>
          <p className="text-sm text-muted-foreground">
            Ha ocurrido un error inesperado en nuestros servidores. Estamos trabajando para solucionarlo.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <Button onClick={() => reset()} variant="outline" className="w-full">
            Intentar de nuevo
          </Button>
          <Button asChild className="w-full">
            <Link href="/">
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
