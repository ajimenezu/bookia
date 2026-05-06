"use client"

import { useState, useEffect } from "react"
import { Plus, UserPlus, Loader2, Wrench } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createUser, getShopServices } from "@/app/[slug]/admin/clientes/actions"
import { toast } from "sonner"
import { Role } from "@prisma/client"
import { cn } from "@/lib/utils"

interface ServiceOption { id: string; name: string; duration: number }

interface CreateUserModalProps {
  currentUserRole: Role
  isSuperAdmin: boolean
  shopId?: string
  mode?: 'CLIENT' | 'STAFF'
}

export function CreateUserModal({ currentUserRole, isSuperAdmin, shopId, mode = 'CLIENT' }: CreateUserModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<ServiceOption[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [noneSelected, setNoneSelected] = useState(false)

  useEffect(() => {
    if (open && mode === 'STAFF' && shopId) {
      getShopServices(shopId).then(res => {
        if (res.success && res.data) setServices(res.data)
      })
    }
  }, [open, mode, shopId])

  const getAvailableRoles = () => {
    if (mode === 'CLIENT') return [{ value: "CUSTOMER", label: "Cliente" }]
    if (isSuperAdmin) return [
      { value: "STAFF", label: "Personal" },
      { value: "OWNER", label: "Dueño / Gerente" },
    ]
    if (currentUserRole === "OWNER") return [{ value: "STAFF", label: "Personal" }]
    return []
  }

  const availableRoles = getAvailableRoles()
  const showRoleSelect = mode === 'STAFF' && isSuperAdmin
  const defaultRole = mode === 'CLIENT' ? 'CUSTOMER' : 'STAFF'

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [touched, setTouched] = useState({ name: false, email: false, phone: false })

  const serviceSelectionValid = mode === 'CLIENT' || noneSelected || selectedServiceIds.length > 0
  const isFormValid = name.trim() !== "" && email.trim() !== "" && phone.trim() !== "" && serviceSelectionValid

  const toggleService = (id: string) => {
    setNoneSelected(false)
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleNone = () => {
    setNoneSelected(true)
    setSelectedServiceIds([])
  }

  const resetForm = () => {
    setName(""); setEmail(""); setPhone("")
    setTouched({ name: false, email: false, phone: false })
    setSelectedServiceIds([]); setNoneSelected(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!serviceSelectionValid) {
      toast.error("Debes seleccionar al menos un servicio o 'Ninguno'")
      return
    }
    setLoading(true)
    const formData = new FormData(event.currentTarget)

    // Append serviceIds as JSON string (required for STAFF/OWNER)
    if (mode === 'STAFF') {
      formData.set("serviceIds", JSON.stringify(selectedServiceIds))
    }

    try {
      const result = await createUser(formData)
      if (result.success) {
        toast.success("Usuario creado exitosamente")
        setOpen(false)
        resetForm()
      } else {
        toast.error(result.error || "Error al crear usuario")
      }
    } catch {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Nuevo {mode === 'STAFF' ? 'Personal' : 'Usuario'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[480px] max-h-[90dvh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {mode === 'STAFF' ? 'Crear Nuevo Personal' : 'Crear Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="shopId" value={shopId || ""} />

            <div className="grid gap-1">
              <Label htmlFor="name" className={touched.name && !name.trim() ? "text-destructive" : ""}>Nombre Completo *</Label>
              <Input 
                id="name" name="name" value={name} 
                onChange={(e) => setName(e.target.value)} 
                onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                placeholder="Ej: Juan Pérez" required 
                className={touched.name && !name.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.name && !name.trim() && <p className="text-xs text-destructive">El nombre es requerido</p>}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="email" className={touched.email && !email.trim() ? "text-destructive" : ""}>Correo Electrónico *</Label>
              <Input 
                id="email" name="email" value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                type="email" placeholder="juan@ejemplo.com" required 
                className={touched.email && !email.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.email && !email.trim() && <p className="text-xs text-destructive">El correo es requerido</p>}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="phone" className={touched.phone && !phone.trim() ? "text-destructive" : ""}>Teléfono *</Label>
              <Input 
                id="phone" name="phone" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                placeholder="+506 8888 8888" required
                className={touched.phone && !phone.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.phone && !phone.trim() && <p className="text-xs text-destructive">El teléfono es requerido</p>}
            </div>

            {showRoleSelect ? (
              <div className="grid gap-1">
                <Label htmlFor="role">Tipo de Usuario *</Label>
                <Select name="role" defaultValue={defaultRole} required>
                  <SelectTrigger><SelectValue placeholder="Seleccione un rol" /></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <input type="hidden" name="role" value={defaultRole} />
            )}

            {/* Service Assignment — STAFF mode only */}
            {mode === 'STAFF' && (
              <div className="grid gap-2">
                <Label className={cn("flex items-center gap-1.5", !serviceSelectionValid ? "text-destructive" : "")}>
                  <Wrench className="h-3.5 w-3.5 text-primary" />
                  Servicios que ofrece *
                </Label>
                {services.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Cargando servicios...</p>
                ) : (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Selección de servicios">
                    {services.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={selectedServiceIds.includes(s.id)}
                        onClick={() => toggleService(s.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary",
                          selectedServiceIds.includes(s.id)
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted/60"
                        )}
                      >
                        {s.name}
                        <span className="text-[10px] opacity-60 font-normal">{s.duration}min</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-pressed={noneSelected}
                      onClick={handleNone}
                      className={cn(
                        "inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary",
                        noneSelected
                          ? "border-muted-foreground bg-muted text-muted-foreground"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/40"
                      )}
                    >
                      Ninguno
                    </button>
                  </div>
                )}
                {!serviceSelectionValid && (
                  <p className="text-xs text-destructive">Selecciona al menos un servicio o "Ninguno"</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
