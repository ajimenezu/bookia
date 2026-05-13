"use client"

import { useState, useEffect, useTransition } from "react"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Tag, 
  Loader2, 
  History,
  ShieldCheck,
  Power,
  Pencil,
  Save,
  X,
  Wrench
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getStaffDetails, updateStaffStatus, updateStaffProfile } from "@/app/[slug]/admin/staff/actions"
import { getShopServices } from "@/app/[slug]/admin/clientes/actions"
import { formatTime } from "@/lib/date-utils"
import { Role } from "@prisma/client"
import { StatusBadge } from "./appointments/status-badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getTerminology } from "@/lib/dictionaries"
import { getAppointmentServicesName } from "@/lib/appointments"

interface StaffDetailSheetProps {
  staffId: string | null
  shopId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentUserRole: Role
  currentUserId: string
  isSuperAdmin: boolean
  businessType: string
}

export function StaffDetailSheet({ 
  staffId, 
  shopId, 
  isOpen, 
  onOpenChange,
  currentUserRole,
  currentUserId,
  isSuperAdmin,
  businessType
}: StaffDetailSheetProps) {
  const [loading, setLoading] = useState(false)
  const [staffData, setStaffData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", phone: "" })
  const [editServiceIds, setEditServiceIds] = useState<string[]>([])
  const [editNone, setEditNone] = useState(false)
  const t = getTerminology(businessType as any)
  const [shopServices, setShopServices] = useState<{id: string; name: string; duration: number}[]>([])
  const [isSavePending, startSaveTransition] = useTransition()
  const [isStatusPending, startStatusTransition] = useTransition()

  useEffect(() => {
    async function loadData() {
      if (!staffId || !isOpen) return
      setLoading(true)
      try {
        const [staffRes, servicesRes] = await Promise.all([
          getStaffDetails(staffId, shopId),
          getShopServices(shopId)
        ])
        if (staffRes.success && staffRes.data) {
          setStaffData(staffRes.data)
          setEditForm({
            name: staffRes.data.name || "",
            phone: staffRes.data.phone || ""
          })
          const assignedIds = (staffRes.data.staffServices || []).map((s: any) => s.id)
          setEditServiceIds(assignedIds)
          setEditNone(assignedIds.length === 0)
        }
        if (servicesRes.success && servicesRes.data) setShopServices(servicesRes.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [staffId, shopId, isOpen])

  const appointments = staffData?.appointmentsAsStaff || []
  const membership = staffData?.memberships?.[0]
  const isActive = membership?.isActive ?? true
  const targetRole = membership?.role as Role

  // RBAC Rules
  const canEdit = isSuperAdmin || currentUserId === staffId
  const canDeactivate = (isSuperAdmin && targetRole !== Role.SUPER_ADMIN) || (currentUserRole === Role.OWNER && targetRole === Role.STAFF)

  const handleToggleStatus = () => {
    startStatusTransition(async () => {
      const result = await updateStaffStatus(staffId!, shopId, !isActive)
      if (result.success) {
        toast.success(isActive ? "Personal desactivado" : "Personal activado")
        setStaffData({
          ...staffData,
          memberships: [{ ...membership, isActive: !isActive }]
        })
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleSaveProfile = () => {
    startSaveTransition(async () => {
      const result = await updateStaffProfile(staffId!, shopId, {
        ...editForm,
        serviceIds: editServiceIds
      })
      if (result.success) {
        toast.success("Perfil actualizado")
        setStaffData({
          ...staffData,
          name: editForm.name,
          phone: editForm.phone,
          staffServices: editServiceIds.map(id => ({ id, name: shopServices.find(s => s.id === id)?.name || id }))
        })
        setEditNone(editServiceIds.length === 0)
        setIsEditing(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const assignedServices: {id:string; name:string}[] = staffData?.staffServices || []
  const originalServiceIds = assignedServices.map(s => s.id)
  const servicesChanged = isEditing && (
    editServiceIds.length !== originalServiceIds.length ||
    editServiceIds.some(id => !originalServiceIds.includes(id))
  )
  const isDirty = staffData && (
    editForm.name !== (staffData.name || "") ||
    editForm.phone !== (staffData.phone || "") ||
    servicesChanged
  )

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) setIsEditing(false)
    }}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-[100dvh] border-l border-border bg-background">
        <SheetHeader className="px-6 py-6 sm:px-10 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg transition-all",
                isActive ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-muted text-muted-foreground grayscale"
              )}>
                {staffData?.name?.charAt(0) || <User className="h-8 w-8" />}
              </div>
              <div>
                <SheetTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  {staffData?.name || "Cargando..."}
                  {!isActive && <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest bg-muted text-muted-foreground">Inactivo</Badge>}
                </SheetTitle>
                <SheetDescription className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {targetRole === 'OWNER' ? 'Propietario / Gerente' : targetRole === 'SUPER_ADMIN' ? 'Administrador' : 'Personal del Negocio'}
                </SheetDescription>
              </div>
            </div>
            
            <div className="flex gap-2">
              {canDeactivate && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "rounded-xl px-4 h-10 gap-2 transition-all font-black text-[10px] uppercase tracking-widest",
                    isActive ? "text-destructive border-destructive/20 hover:bg-destructive/5" : "text-success border-success/20 hover:bg-success/5"
                  )}
                  onClick={handleToggleStatus}
                  disabled={isStatusPending}
                >
                  {isStatusPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                  {isActive ? "Desactivar" : "Activar"}
                </Button>
              )}
              {canEdit && !isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl px-4 h-10 gap-2 text-primary border-primary/20 hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold animate-pulse">Cargando información...</p>
          </div>
        ) : staffData ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 sm:p-10 space-y-10">
                {/* Profile Details */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Información de Contacto</h3>
                    {isEditing && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-[10px] font-black uppercase tracking-widest gap-1">
                          <X className="h-3 w-3" /> Cancelar
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSaveProfile} 
                          disabled={isSavePending || !isDirty} 
                          className="h-7 text-[10px] font-black uppercase tracking-widest gap-1 bg-success hover:bg-success/90"
                        >
                          {isSavePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Guardar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <User className="h-3 w-3 text-primary" /> Nombre Completo
                      </p>
                      {isEditing ? (
                        <Input 
                          value={editForm.name} 
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="h-9 font-bold text-sm bg-background/50"
                        />
                      ) : (
                        <p className="font-bold text-foreground">{staffData.name}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3 text-primary" /> Correo Electrónico
                      </p>
                      <p className="font-bold text-foreground break-all">{staffData.email}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3 text-primary" /> Teléfono
                      </p>
                      {isEditing ? (
                        <Input 
                          value={editForm.phone} 
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="h-9 font-bold text-sm bg-background/50"
                        />
                      ) : (
                        <p className="font-bold text-foreground">{staffData.phone || "No registrado"}</p>
                      )}
                    </div>

                    {/* Service Assignment */}
                    <div className="space-y-2 col-span-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Wrench className="h-3 w-3 text-primary" /> Servicios que ofrece
                      </p>
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Selección de servicios">
                          {shopServices.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              aria-pressed={editServiceIds.includes(s.id)}
                              onClick={() => {
                                setEditNone(false)
                                setEditServiceIds(prev =>
                                  prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                )
                              }}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary",
                                editServiceIds.includes(s.id)
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
                              )}
                            >
                              {s.name}
                            </button>
                          ))}
                          <button
                            type="button"
                            aria-pressed={editNone}
                            onClick={() => { setEditNone(true); setEditServiceIds([]) }}
                            className={cn(
                              "inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary",
                              editNone
                                ? "border-muted-foreground bg-muted text-muted-foreground"
                                : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/40"
                            )}
                          >Ninguno</button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {assignedServices.length > 0 ? (
                            assignedServices.map(s => (
                              <span key={s.id} className="inline-flex items-center rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
                                {s.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Ninguno (no aparece en el flujo de reserva)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Recent Activity */}
                <section className="space-y-6 pb-20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <History className="h-5 w-5" />
                      <h3 className="font-black uppercase tracking-widest text-xs">{t.appointmentHistory}</h3>
                    </div>
                    <Badge variant="outline" className="rounded-lg font-black text-[10px]">
                      ÚLTIMAS 5
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {appointments.length > 0 ? (
                      appointments.map((app: any) => (
                        <div key={app.id} className="group glass-card rounded-2xl p-5 border border-border shadow-sm hover:border-primary/30 transition-all bg-card/40">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                <p className="text-sm font-black">
                                  {new Date(app.startTime).toLocaleDateString('es-ES', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs font-bold text-muted-foreground">
                                  {formatTime(app.startTime)}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={app.status} className="px-2 py-0.5 text-[10px]" />
                          </div>

                          <div className="space-y-3 pt-3 border-t border-border/20">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-secondary text-secondary-foreground">
                                <Tag className="h-3 w-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">
                                  {getAppointmentServicesName(app)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-secondary text-secondary-foreground">
                                <User className="h-3 w-3" />
                              </div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Cliente: <span className="text-foreground font-bold">{app.customer?.name || "Cliente sin nombre"}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 px-6 rounded-[2rem] border border-dashed border-border/60 bg-muted/5">
                        <History className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-xs font-bold text-muted-foreground">Sin actividad reciente</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
          </ScrollArea>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
