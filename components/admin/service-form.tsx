"use client"

import { useState } from "react"
import { Clock, DollarSign, Type, AlignLeft, Trash2, Loader2, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ServiceCard } from "@/components/admin/service-card"
import { createService, updateService, deleteService } from "@/app/[slug]/admin/servicios/actions"
import { toast } from "sonner"
import { BusinessType } from "@/lib/dictionaries"
import { getBusinessIcon } from "@/lib/business-icons"

interface ServiceFormProps {
  slug: string
  shopId?: string
  businessType?: BusinessType
  initialData?: {
    id: string
    name: string
    description: string | null
    price: number
    duration: number
  }
  onSuccess?: () => void
}

export function ServiceForm({ slug, shopId, businessType = "BARBERIA", initialData, onSuccess }: ServiceFormProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const initialDuration = initialData?.duration || 30
  const initialHours = Math.floor(initialDuration / 60)
  const initialMinutes = initialDuration % 60

  const [previewData, setPreviewData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    hours: initialHours.toString(),
    minutes: initialMinutes.toString()
  })

  const isEditing = !!initialData

  // Selection of icon based on business type for the preview header
  const ServiceIcon = getBusinessIcon(businessType)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    formData.set("slug", slug)
    if (shopId) {
      formData.set("shopId", shopId)
    }
    if (isEditing && initialData) {
      formData.set("id", initialData.id)
    }

    // Combine hours and minutes into total duration
    const totalMinutes = (Number(previewData.hours) * 60) + Number(previewData.minutes)
    formData.set("duration", totalMinutes.toString())

    try {
      if (isEditing) {
        const result = await updateService(formData)
        if (!result?.success) throw new Error(result?.error || "Error al actualizar")
        toast.success("Servicio actualizado correctamente")
      } else {
        const result = await createService(formData)
        if (!result?.success) throw new Error(result?.error || "Error al crear")
        toast.success("Servicio creado correctamente")
      }
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal")
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!initialData) return
    if (!confirm("¿Estás seguro de que quieres eliminar este servicio?")) return

    setDeleting(true)
    try {
      await deleteService(initialData.id)
      toast.success("Servicio eliminado correctamente")
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-10 py-4">
      <form onSubmit={handleSubmit} className="grid gap-8">
        <div className="grid gap-2.5">
          <Label htmlFor="name" className="flex items-center gap-2 font-medium text-sm text-foreground/80">
            <Type className="h-4 w-4 text-primary" /> Nombre del Servicio
          </Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="Ej. Corte de Cabello + Barba" 
            required 
            disabled={loading || deleting}
            value={previewData.name} 
            onChange={(e) => setPreviewData({ ...previewData, name: e.target.value })}
            className="h-11 bg-background border-border focus:ring-primary focus:border-primary transition-all shadow-xs"
          />
        </div>
        
        <div className="grid gap-2.5">
          <Label htmlFor="description" className="flex items-center gap-2 font-medium text-sm text-foreground/80">
            <AlignLeft className="h-4 w-4 text-primary" /> Descripción (Opcional)
          </Label>
          <Textarea 
            id="description" 
            name="description" 
            placeholder="Breve descripción..." 
            className="min-h-[120px] bg-background border-border focus:ring-primary focus:border-primary transition-all resize-none shadow-xs"
            disabled={loading || deleting} 
            value={previewData.description} 
            onChange={(e) => setPreviewData({ ...previewData, description: e.target.value })} 
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="grid gap-2.5">
            <Label htmlFor="price" className="flex items-center gap-2 font-medium text-sm text-foreground/80">
              <DollarSign className="h-4 w-4 text-primary" /> Precio
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-muted-foreground text-sm font-medium">₡</span>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                step="1" 
                placeholder="15000" 
                required 
                className="pl-8 h-11 bg-background border-border focus:ring-primary focus:border-primary transition-all shadow-xs"
                disabled={loading || deleting} 
                value={previewData.price} 
                onChange={(e) => setPreviewData({ ...previewData, price: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="grid gap-2.5">
            <Label className="flex items-center gap-2 font-medium text-sm text-foreground/80">
              <Clock className="h-4 w-4 text-primary" /> Duración estimada
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <div className="relative">
                  <Input 
                    id="hours" 
                    type="number" 
                    min="0"
                    placeholder="0" 
                    required 
                    disabled={loading || deleting}
                    value={previewData.hours} 
                    onChange={(e) => setPreviewData({ ...previewData, hours: e.target.value })} 
                    className="h-11 bg-background border-border focus:ring-primary focus:border-primary transition-all shadow-xs pr-8"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-muted-foreground uppercase pointer-events-none">h</span>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="relative">
                  <Input 
                    id="minutes" 
                    type="number" 
                    min="0"
                    max="59"
                    step="5"
                    placeholder="30" 
                    required 
                    disabled={loading || deleting}
                    value={previewData.minutes} 
                    onChange={(e) => setPreviewData({ ...previewData, minutes: e.target.value })} 
                    className="h-11 bg-background border-border focus:ring-primary focus:border-primary transition-all shadow-xs pr-10"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-muted-foreground uppercase pointer-events-none">min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between border-t border-border/60">
          {isEditing && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDelete} 
              disabled={loading || deleting}
              className="w-full sm:w-auto border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive transition-colors h-11"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:ml-auto w-full sm:w-auto">
            <Button 
              type="submit" 
              disabled={loading || deleting} 
              className="w-full sm:w-auto px-8 h-11 font-semibold shadow-md active:scale-[0.98] transition-all"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Servicio"}
            </Button>
          </div>
        </div>
      </form>

      <div className="relative pt-10">
        <div className="absolute inset-x-0 top-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border/60"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70 flex items-center gap-2">
            <ServiceIcon className="h-3.5 w-3.5 text-primary" /> Vista Previa
          </span>
        </div>
        <div className="mt-10 px-1">
          <ServiceCard 
            isPreview 
            businessType={businessType}
            name={previewData.name} 
            description={previewData.description}
            price={previewData.price ? `₡${Number(previewData.price).toLocaleString("es-CR")}` : "₡0"} 
            duration={((Number(previewData.hours) * 60) + Number(previewData.minutes)).toString()} 
          />
        </div>
      </div>
    </div>
  )
}
