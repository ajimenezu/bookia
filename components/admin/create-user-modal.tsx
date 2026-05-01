"use client"

import { useState } from "react"
import { Plus, UserPlus, Loader2 } from "lucide-react"
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
import { createUser } from "@/app/[slug]/admin/clientes/actions"
import { toast } from "sonner"
import { Role } from "@prisma/client"

interface CreateUserModalProps {
  currentUserRole: Role
  isSuperAdmin: boolean
  shopId?: string
}

export function CreateUserModal({ currentUserRole, isSuperAdmin, shopId }: CreateUserModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Determine available roles based on current user role
  const getAvailableRoles = () => {
    if (isSuperAdmin) {
      return [
        { value: "CUSTOMER", label: "Cliente" },
        { value: "STAFF", label: "Staff" },
        { value: "OWNER", label: "Dueño" },
        { value: "SUPER_ADMIN", label: "Super Admin" },
      ]
    }
    if (currentUserRole === "OWNER") {
      return [
        { value: "CUSTOMER", label: "Cliente" },
        { value: "STAFF", label: "Staff" },
      ]
    }
    if (currentUserRole === "STAFF") {
      return [
        { value: "CUSTOMER", label: "Cliente" },
      ]
    }
    return []
  }

  const availableRoles = getAvailableRoles()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [touched, setTouched] = useState({ name: false, email: false, phone: false })

  const isFormValid = name.trim() !== "" && email.trim() !== "" && phone.trim() !== ""

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    
    try {
      const result = await createUser(formData)
      if (result.success) {
        toast.success("Usuario creado exitosamente")
        setOpen(false)
        setName("")
        setEmail("")
        setPhone("")
        setTouched({ name: false, email: false, phone: false })
      } else {
        toast.error(result.error || "Error al crear usuario")
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) {
        setName("")
        setEmail("")
        setPhone("")
        setTouched({ name: false, email: false, phone: false })
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Nuevo Usuario</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[425px]"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Crear Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              Ingrese la información del nuevo usuario. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="shopId" value={shopId || ""} />
            <div className="grid gap-1">
              <Label htmlFor="name" className={touched.name && !name.trim() ? "text-destructive" : ""}>Nombre Completo *</Label>
              <Input 
                id="name" 
                name="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                placeholder="Ej: Juan Pérez" 
                required 
                className={touched.name && !name.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.name && !name.trim() && (
                <p className="text-xs text-destructive">El nombre es requerido</p>
              )}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="email" className={touched.email && !email.trim() ? "text-destructive" : ""}>Correo Electrónico *</Label>
              <Input 
                id="email" 
                name="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                type="email" 
                placeholder="juan@ejemplo.com" 
                required 
                className={touched.email && !email.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.email && !email.trim() && (
                <p className="text-xs text-destructive">El correo electrónico es requerido</p>
              )}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="phone" className={touched.phone && !phone.trim() ? "text-destructive" : ""}>Teléfono *</Label>
              <Input 
                id="phone" 
                name="phone" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                placeholder="+506 8888 8888" 
                required
                className={touched.phone && !phone.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.phone && !phone.trim() && (
                <p className="text-xs text-destructive">El teléfono es requerido</p>
              )}
            </div>
            {isSuperAdmin ? (
              <div className="grid gap-1">
                <Label htmlFor="role">Tipo de Usuario *</Label>
                <Select name="role" defaultValue="CUSTOMER" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <input type="hidden" name="role" value="CUSTOMER" />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
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
