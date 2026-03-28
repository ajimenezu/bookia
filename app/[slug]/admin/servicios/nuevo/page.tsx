"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Scissors, Clock, DollarSign, Type, AlignLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { createService } from "../actions"
import { ServiceCard } from "@/components/admin/service-card"

export default function NuevoServicioPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState({ name: "", description: "", price: "", duration: "" })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    formData.set("slug", slug)
    try {
      await createService(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal")
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-2 h-9 px-2 text-muted-foreground hover:text-foreground">
          <Link href={`/${slug}/admin/servicios`}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Volver a servicios
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Nuevo Servicio</h1>
        <p className="mt-1 text-muted-foreground">Define un nuevo servicio para tu negocio</p>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Información del Servicio</CardTitle>
            <CardDescription>Estos detalles serán visibles para tus clientes al momento de reservar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" /> Nombre del Servicio
              </Label>
              <Input id="name" name="name" placeholder="Ej. Corte de Cabello + Barba" required disabled={loading}
                value={previewData.name} onChange={(e) => setPreviewData({ ...previewData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-muted-foreground" /> Descripción (Opcional)
              </Label>
              <Textarea id="description" name="description" placeholder="Breve descripción..." className="min-h-[100px]"
                disabled={loading} value={previewData.description} onChange={(e) => setPreviewData({ ...previewData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" /> Precio
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₡</span>
                  <Input id="price" name="price" type="number" step="1" placeholder="15000" required className="pl-7"
                    disabled={loading} value={previewData.price} onChange={(e) => setPreviewData({ ...previewData, price: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Duración (minutos)
                </Label>
                <Input id="duration" name="duration" type="number" placeholder="30" required disabled={loading}
                  value={previewData.duration} onChange={(e) => setPreviewData({ ...previewData, duration: e.target.value })} />
              </div>
            </div>
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.push(`/${slug}/admin/servicios`)} disabled={loading} className="w-full sm:w-auto cursor-pointer">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto cursor-pointer">
              {loading ? "Guardando..." : "Crear Servicio"}
            </Button>
          </CardFooter>
        </Card>
      </form>
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Vista Previa</h2>
        <ServiceCard isPreview name={previewData.name} description={previewData.description}
          price={previewData.price ? `₡${Number(previewData.price).toLocaleString("es-CR")}` : "₡0"} duration={previewData.duration} />
      </div>
    </div>
  )
}
