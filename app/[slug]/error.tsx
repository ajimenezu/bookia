"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AlertOctagon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  // Extraer el slug del negocio de la URL
  const slug = pathname?.split("/")[1] || ""

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass-card animate-in fade-in zoom-in duration-300 flex max-w-md flex-col items-center justify-center space-y-6 rounded-xl border border-border/50 bg-background/50 p-8 text-center backdrop-blur-md shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertOctagon className="size-8" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Error del sistema
          </h1>
          <p className="text-sm text-muted-foreground">
            Ha ocurrido un problema al cargar esta página. Por favor, intenta de nuevo.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <Button onClick={() => reset()} variant="outline" className="w-full">
            Reintentar
          </Button>
          <Button onClick={() => router.back()} variant="secondary" className="w-full">
            Regresar
          </Button>
        </div>
        
        {slug && (
          <Button asChild variant="ghost" className="w-full mt-2">
            <Link href={`/${slug}`}>
              Ir al inicio del negocio
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
