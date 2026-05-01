"use client"

import { useState } from "react"
import { User, Phone, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserProfile } from "@/app/[slug]/profile/actions"
import { toast } from "sonner"

interface EditProfileModalProps {
  user: {
    name: string | null
    email: string
    phone: string | null
  }
  shopSlug: string
}

export function EditProfileModal({ user, shopSlug }: EditProfileModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState(user.name || "")
  const [phone, setPhone] = useState(user.phone || "")
  
  const hasChanges = name !== (user.name || "") || phone !== (user.phone || "")
  const isValid = name.trim().length >= 2 && phone.trim().length >= 8

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hasChanges) return

    setLoading(true)
    try {
      const result = await updateUserProfile({ name, phone, shopSlug })
      if (result.success) {
        toast.success("Perfil actualizado correctamente")
        setOpen(false)
      } else {
        toast.error(result.error || "Error al actualizar perfil")
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl border-primary/20 bg-primary/5 text-primary hover:!bg-primary hover:!text-primary-foreground transition-all">
          <Save className="h-4 w-4" />
          <span>Editar Perfil</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-border bg-card shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <User className="h-6 w-6 text-primary" />
              Editar Perfil
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Actualiza tu información personal aquí. Haz clic en guardar cuando termines.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-8">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Correo Electrónico (No editable)
              </Label>
              <Input 
                id="email" 
                value={user.email} 
                disabled 
                className="bg-muted/50 border-border/50 text-muted-foreground cursor-not-allowed h-12 rounded-xl font-medium"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Nombre Completo
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre" 
                  className="pl-10 h-12 rounded-xl border-border bg-background focus:ring-primary font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Teléfono
              </Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+506 8888 8888" 
                  className="pl-10 h-12 rounded-xl border-border bg-background focus:ring-primary font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-4 pt-4 border-t border-border/50">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="rounded-xl font-bold text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !hasChanges || !isValid}
              className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] h-11"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
