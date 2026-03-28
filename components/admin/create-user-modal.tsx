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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    
    try {
      const result = await createUser(formData)
      if (result.success) {
        toast.success("Usuario creado exitosamente")
        setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Nuevo Usuario</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" name="name" placeholder="Ej: Juan Pérez" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input id="email" name="email" type="email" placeholder="juan@ejemplo.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" placeholder="+506 8888 8888" />
            </div>
            <div className="grid gap-2">
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
