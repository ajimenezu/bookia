"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ShopNotFound() {
  const pathname = usePathname()
  const router = useRouter()
  // Extraer el slug del negocio de la URL (ej. /barberia-demo/admin -> barberia-demo)
  const slug = pathname?.split("/")[1] || ""

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass-card animate-in fade-in zoom-in duration-300 flex max-w-md flex-col items-center justify-center space-y-6 rounded-xl border border-border/50 bg-background/50 p-8 text-center backdrop-blur-md shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SearchX className="size-8" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Página no encontrada
          </h1>
          <p className="text-sm text-muted-foreground">
            No pudimos encontrar la página que buscas dentro de este negocio.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <Button onClick={() => router.back()} variant="outline" className="w-full">
            Regresar
          </Button>
          {slug && (
            <Button asChild className="w-full">
              <Link href={`/`}>
                Ir al inicio
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
