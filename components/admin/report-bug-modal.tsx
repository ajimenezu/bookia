"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Bug, Loader2, UploadCloud, X } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const bugReportSchema = z.object({
  url: z.string().min(1, "La URL es requerida"),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
})

type BugReportValues = z.infer<typeof bugReportSchema>

export function ReportBugModal({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  
  const form = useForm<BugReportValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      url: typeof window !== "undefined" ? window.location.href : pathname,
      title: "",
      description: "",
    },
  })

  // Whenever modal opens, make sure URL is fresh
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      form.setValue("url", typeof window !== "undefined" ? window.location.href : pathname)
    } else {
      form.reset()
      setFiles([])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      // Filter out non-images
      const imageFiles = selectedFiles.filter(file => file.type.startsWith("image/"))
      if (imageFiles.length !== selectedFiles.length) {
        toast.error("Solo se permiten archivos de imagen.")
      }
      setFiles(prev => [...prev, ...imageFiles].slice(0, 5)) // Max 5 files
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: BugReportValues) => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const imageUrls: string[] = []

      // Upload files
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("bug-reports")
          .upload(fileName, file, { cacheControl: "3600", upsert: false })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          throw new Error("Error al subir la imagen")
        }

        const { data: { publicUrl } } = supabase.storage
          .from("bug-reports")
          .getPublicUrl(fileName)

        imageUrls.push(publicUrl)
      }

      // Collect metadata
      const metadata = {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Desconocido",
        timestamp: new Date().toISOString()
      }

      // Send to API
      const res = await fetch("/api/report-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          metadata,
          imageUrls
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        if (errorData.details) {
          console.error("Backend validation details:", errorData.details)
          const fieldErrors = Object.entries(errorData.details)
            .filter(([key]) => key !== "_errors")
            .map(([key, value]: [string, any]) => {
              const errors = value?._errors || []
              return `${key}: ${errors.join(", ")}`
            })
            .filter(err => err.length > (err.indexOf(':') + 2)) // Only keep if there are actual errors after colon
            .join("\n")

          if (fieldErrors) {
            throw new Error(`Datos inválidos en: ${fieldErrors}`)
          }
        }
        throw new Error(errorData.error || "Error al enviar el reporte")
      }

      toast.success("Reporte enviado con éxito. ¡Gracias por tu feedback!")
      setOpen(false)
      form.reset()
      setFiles([])
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90dvh] overflow-y-auto">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              Reportar un Problema
            </DialogTitle>
            <DialogDescription>
              Ayúdanos a mejorar. Describe el problema que encontraste en esta página.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1">
              <Label htmlFor="url">URL de la página</Label>
              <Input 
                id="url" 
                {...form.register("url")} 
                readOnly
              />
              <p className="text-sm text-destructive min-h-[20px]">
                {form.formState.errors.url ? form.formState.errors.url.message : ""}
              </p>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="title">Resumen / Título</Label>
              <Input 
                id="title" 
                placeholder="Ej. El botón de guardar no funciona"
                {...form.register("title")} 
              />
              <p className="text-sm text-destructive min-h-[20px]">
                {form.formState.errors.title ? form.formState.errors.title.message : ""}
              </p>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="description">Descripción detallada</Label>
              <Textarea 
                id="description" 
                placeholder="Por favor describe qué estabas intentando hacer y qué ocurrió..."
                rows={4}
                {...form.register("description")} 
                className="resize-none"
              />
              <p className="text-sm text-destructive min-h-[20px]">
                {form.formState.errors.description ? form.formState.errors.description.message : ""}
              </p>
            </div>

            <div className="grid gap-1">
              <Label>Capturas de pantalla (Opcional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors relative">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  disabled={isSubmitting || files.length >= 5}
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Arrastra imágenes aquí o haz clic para subir (Máx 5)
                  </span>
                </div>
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-md text-xs">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Reporte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
