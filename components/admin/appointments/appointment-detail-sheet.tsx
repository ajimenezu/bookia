"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  User,
  Tag,
  Phone,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Save,
  Undo2,
  X,
  Trash2,
  MessageSquare,
  Plus
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StatusBadge } from "./status-badge"
import { formatTime, toCRDate, formatTime24h, convertTo12h } from "@/lib/date-utils"
import { updateAppointmentStatus, updateBooking, fetchAvailableSlots, addAppointmentNote, updateAppointmentNote, deleteAppointmentNote } from "@/app/schedule/actions"
import { AppointmentStatus } from "@prisma/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { BusinessType, getTerminology } from "@/lib/dictionaries"

interface AppointmentDetailSheetProps {
  appointment: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  businessType: BusinessType
  services: { id: string; name: string; price: number; duration: number; categories?: string[] }[]
  staff: { id: string; name: string }[]
}

type BookedService = {
  id: string;
  name: string;
  price: number;
}

type Mode = "preview" | "edit"

export function AppointmentDetailSheet({
  appointment,
  isOpen,
  onOpenChange,
  shopId,
  businessType,
  services,
  staff
}: AppointmentDetailSheetProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("preview")
  const [isUpdating, setIsUpdating] = useState(false)
  const t = getTerminology(businessType)

  // Edit Form State
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isUpdatingNote, setIsUpdatingNote] = useState(false)
  
  // Optimistic UI state
  const [localNotes, setLocalNotes] = useState<any[]>([])

  // Sync local notes when appointment changes
  useEffect(() => {
    if (appointment?.notes) {
      setLocalNotes(appointment.notes)
    } else {
      setLocalNotes([])
    }
  }, [appointment])

  // Initialize form state when entering edit mode or when appointment changes
  useEffect(() => {
    if (appointment && isOpen) {
      const apptDate = new Date(appointment.startTime)
      setSelectedServices(appointment.services?.map((s: any) => s.id) || (appointment.serviceId ? [appointment.serviceId] : []))
      setSelectedStaff(appointment.staffId || "")
      setSelectedDate(apptDate)
      setSelectedTime(formatTime24h(appointment.startTime)) // Get HH:MM
      setCustomerName(appointment.customerName || "")
      setCustomerPhone(appointment.customerPhone || "")
      setNotes("") // Reset input notes
    }
    if (!isOpen) {
      setMode("preview") // Reset mode when closing
      setNotes("")
    }
  }, [appointment, isOpen])

  // Fetch slots whenever date or staff changes
  useEffect(() => {
    async function loadSlots() {
      if (selectedDate && selectedStaff && mode === "edit" && appointment) {
        setIsLoadingSlots(true)
        const dateStr = selectedDate.toISOString().split('T')[0]
        try {
          const slots = await fetchAvailableSlots(shopId, selectedStaff, dateStr, appointment.id)
          setAvailableSlots(slots)
        } catch (error) {
          console.error(error)
        } finally {
          setIsLoadingSlots(false)
        }
      }
    }
    loadSlots()
  }, [selectedDate, selectedStaff, mode, shopId, appointment?.id])

  const isDirty = useMemo(() => {
    if (!appointment || mode !== "edit") return false
    
    const initialServices = appointment.services?.map((s: any) => s.id) || (appointment.serviceId ? [appointment.serviceId] : [])
    const initialStaff = appointment.staffId || ""
    const apptDate = new Date(appointment.startTime)
    const initialDate = apptDate.toISOString().split('T')[0]
    const currentDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : ""
    const initialTime = formatTime24h(appointment.startTime)
    const initialName = appointment.customerName || ""
    const initialPhone = appointment.customerPhone || ""

    const servicesChanged = JSON.stringify([...selectedServices].sort()) !== JSON.stringify([...initialServices].sort())
    
    return (
      servicesChanged ||
      selectedStaff !== initialStaff ||
      currentDateStr !== initialDate ||
      selectedTime !== initialTime ||
      customerName !== initialName ||
      customerPhone !== initialPhone
    )
  }, [appointment, mode, selectedServices, selectedStaff, selectedDate, selectedTime, customerName, customerPhone])

  const firstSelectedService = useMemo(() => {
    return services.find(s => selectedServices.includes(s.id))
  }, [services, selectedServices])
  
  const activeCategory = firstSelectedService?.categories?.[0] || null

  const handleStatusUpdate = async (newStatus: AppointmentStatus) => {
    setIsUpdating(true)
    try {
      const result = await updateAppointmentStatus(appointment.id, newStatus, shopId)
      const statusLabels: Record<string, string> = {
        COMPLETED: "completada",
        CONFIRMED: "confirmada",
        CANCELLED: "cancelada",
        NO_SHOW: "marcada como no asistió"
      }
      if (result.success) {
        toast.success(`${t.appointment} ${statusLabels[newStatus] || newStatus.toLowerCase()} con éxito`)
        router.refresh()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Ocurrió un error")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddNote = async () => {
    if (!notes.trim()) return
    
    const content = notes.trim()
    const tempId = `temp-${Date.now()}`
    const optimisticNote = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      author: { name: "Tú", email: "" },
      isOptimistic: true
    }

    // Optimistic Update
    setLocalNotes(prev => [optimisticNote, ...prev])
    setNotes("")
    setIsSavingNotes(true)

    try {
      const result = await addAppointmentNote({ 
        appointmentId: appointment.id, 
        content, 
        shopId 
      })
      if (result.success) {
        toast.success("Nota agregada correctamente")
        router.refresh()
      } else {
        // Rollback
        setLocalNotes(prev => prev.filter(n => n.id !== tempId))
        setNotes(content)
        toast.error(result.error || "Error al agregar nota")
      }
    } catch (error) {
      setLocalNotes(prev => prev.filter(n => n.id !== tempId))
      setNotes(content)
      toast.error("Error de conexión")
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return
    
    const originalContent = localNotes.find(n => n.id === noteId)?.content
    const newContent = editContent.trim()

    // Optimistic Update
    setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: newContent } : n))
    setEditingNoteId(null)
    setIsUpdatingNote(true)

    try {
      const result = await updateAppointmentNote({
        noteId,
        content: newContent,
        shopId
      })
      if (result.success) {
        toast.success("Nota actualizada")
        router.refresh()
      } else {
        // Rollback
        setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: originalContent } : n))
        toast.error(result.error || "Error al actualizar nota")
      }
    } catch (error) {
      setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: originalContent } : n))
      toast.error("Error de conexión")
    } finally {
      setIsUpdatingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const originalNotes = [...localNotes]
    
    // Optimistic Update
    setLocalNotes(prev => prev.filter(n => n.id !== noteId))

    try {
      const result = await deleteAppointmentNote({ noteId, shopId })
      if (result.success) {
        toast.success("Nota eliminada")
        router.refresh()
      } else {
        // Rollback
        setLocalNotes(originalNotes)
        toast.error(result.error || "Error al eliminar nota")
      }
    } catch (error) {
      setLocalNotes(originalNotes)
      toast.error("Error de conexión")
    }
  }

  const startEdit = (note: any) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  const handleSaveEdit = async () => {
    if (!selectedDate || !selectedTime || selectedServices.length === 0 || !selectedStaff) {
      toast.error("Por favor completa todos los campos")
      return
    }

    setIsUpdating(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const result = await updateBooking({
        appointmentId: appointment.id,
        shopId,
        serviceIds: selectedServices,
        staffId: selectedStaff,
        date: dateStr,
        time: selectedTime,
        status: appointment.status,
        customerName: !appointment.customerId ? customerName : undefined,
        customerPhone: !appointment.customerId ? customerPhone : undefined,
      })

      if (result.success) {
        toast.success(`${t.appointment} actualizada correctamente`)
        router.refresh()
        setMode("preview")
        onOpenChange(false)
      } else {
        toast.error(result.error || "Error al actualizar")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setIsUpdating(false)
    }
  }



  if (!appointment) return null

  const isPastOrPresent = new Date(appointment.startTime) <= toCRDate(new Date())

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-[100dvh] max-h-[100dvh] border-l border-border bg-background overflow-hidden">
        <SheetHeader className="px-6 py-6 sm:px-10 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                {mode === "preview" ? `Detalles de la ${t.appointment}` : `Editar ${t.appointment}`}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground mt-1">
                {mode === "preview"
                  ? "Revisa la información y gestiona el estado."
                  : `Modifica los ${t.servicePlural.toLowerCase()}, fecha o ${t.staff.toLowerCase()}.`}
              </SheetDescription>
            </div>
            <StatusBadge status={appointment.status} className="px-3 py-1 text-xs" />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 sm:p-10 space-y-8">
            {mode === "preview" ? (
              // PREVIEW MODE
              <>
                {/* Customer Info Section */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <User className="h-5 w-5" />
                      <h3 className="font-bold text-lg">Información del {t.client}</h3>
                    </div>
                  </div>
                  <div className="grid gap-4 rounded-2xl border border-border bg-card/30 p-5 shadow-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Nombre</p>
                      <p className="text-lg font-black text-card-foreground mt-0.5">
                        {appointment.customer?.name || appointment.customerName || t.client}
                      </p>
                    </div>
                    {appointment.customerPhone && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Teléfono</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          <p className="font-mono text-card-foreground">{appointment.customerPhone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status) && !isPastOrPresent && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg font-bold border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                      onClick={() => setMode("edit")}
                    >
                      <Edit3 className="mr-1.5 h-4 w-4" /> Editar Cita
                    </Button>
                  </div>
                )}

                <Separator className="opacity-50" />

                {/* Services & Staff Section */}
                <section className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Tag className="h-4 w-4" />
                      <h3 className="font-bold">{t.servicePlural}</h3>
                    </div>
                    <div className="space-y-2">
                      {(appointment.serviceDetails as BookedService[] | null)?.length ? (
                        (appointment.serviceDetails as BookedService[]).map((s) => {
                          const currentService = services.find(curr => curr.id === s.id);
                          const hasPriceChanged = currentService && Math.abs(currentService.price - s.price) > 0.01;

                          return (
                            <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 border border-border/50 group/price">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{s.name}</span>
                                {hasPriceChanged && (
                                  <span className="text-[10px] text-primary/70 font-semibold flex items-center gap-1">
                                    <AlertCircle className="h-2.5 w-2.5" /> Precio al reservar
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-primary">₡{s.price.toLocaleString()}</span>
                                {hasPriceChanged && (
                                  <span className="text-[9px] text-muted-foreground line-through opacity-60">
                                    Actual: ₡{currentService.price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : appointment.services?.length > 0 ? (
                        appointment.services.map((s: any) => {
                          // Fallback: If only one service and we have priceAtBooking, use that as the historical price
                          const displayPrice = (appointment.services.length === 1 && appointment.priceAtBooking) 
                            ? appointment.priceAtBooking 
                            : s.price;
                            
                          return (
                            <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 border border-border/50">
                              <span className="text-sm font-medium">{s.name}</span>
                              <span className="text-xs font-bold text-primary">₡{displayPrice.toLocaleString()}</span>
                            </div>
                          );
                        })
                      ) : (
                        <Badge variant="secondary" className="px-3 py-1">{appointment.service?.name || "Sin servicio"}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <User className="h-4 w-4" />
                      <h3 className="font-bold">{t.staff}</h3>
                    </div>
                    <div className="rounded-lg bg-secondary/30 px-3 py-2 border border-border/50">
                      <p className="text-sm font-medium">{appointment.staff?.name || "No asignado"}</p>
                    </div>
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Scheduling Info */}
                <section className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Calendar className="h-4 w-4" />
                      <h3 className="font-bold">Fecha</h3>
                    </div>
                    <p className="text-lg font-bold">
                      {new Date(appointment.startTime).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <h3 className="font-bold">Hora</h3>
                    </div>
                    <p className="text-3xl font-black tracking-tight text-primary">
                      {formatTime(appointment.startTime)}
                    </p>
                  </div>
                </section>

                {/* Notes Section */}
                <Separator className="opacity-50" />
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-primary">
                      <MessageSquare className="h-5 w-5" />
                      <h3 className="font-bold uppercase tracking-widest text-xs">Notas de la {t.appointment}</h3>
                    </div>
                    
                    {/* Add Note Form (Top) */}
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5 text-primary" /> Agregar Nueva Nota
                      </p>
                      <textarea
                        className="w-full min-h-[100px] rounded-2xl border border-border bg-background p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-sm"
                        placeholder="Escribe algo importante sobre esta cita..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                          onClick={handleAddNote}
                          disabled={!notes.trim() || isSavingNotes}
                        >
                          {isSavingNotes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Guardar Nota
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Notes List (Bottom) */}
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" /> Historial de Notas
                      </p>
                      
                      {localNotes.length > 0 ? (
                        <div className="space-y-4">
                          {localNotes.map((note: any) => (
                            <div 
                              key={note.id} 
                              className={cn(
                                "bg-background/80 backdrop-blur-sm rounded-2xl p-4 border border-border/60 shadow-sm group/note transition-all",
                                note.isOptimistic && "opacity-60 grayscale-[0.5]"
                              )}
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                                    {note.author?.name?.charAt(0) || "U"}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-foreground">
                                      {note.author?.name || "Usuario"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: es })}
                                    </p>
                                  </div>
                                </div>
                                {!note.isOptimistic && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                      onClick={() => startEdit(note)}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteNote(note.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              {editingNoteId === note.id ? (
                                <div className="space-y-3 mt-2">
                                  <textarea
                                    className="w-full min-h-[80px] rounded-xl border border-border bg-background p-3 text-base focus:ring-1 focus:ring-primary outline-none resize-none shadow-inner"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-9 px-4 text-xs font-bold rounded-lg"
                                      onClick={() => setEditingNoteId(null)}
                                    >
                                      <X className="h-4 w-4 mr-2" /> Cancelar
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-9 px-4 text-xs font-bold rounded-lg"
                                      onClick={() => handleUpdateNote(note.id)}
                                      disabled={isUpdatingNote || !editContent.trim()}
                                    >
                                      {isUpdatingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                      Actualizar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-base text-card-foreground leading-relaxed whitespace-pre-wrap font-medium">
                                  {note.content}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-background/20 rounded-2xl border border-dashed border-border/40">
                          <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                          <p className="text-sm text-muted-foreground font-medium italic">
                            No hay notas registradas para esta cita.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

              </>
            ) : (
              // EDIT MODE
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Guest Customer Section (Only if not registered) */}
                {!appointment.customerId && (
                  <section className="space-y-4 rounded-2xl border border-dashed border-primary/20 p-5 bg-primary/5">
                    <div className="flex items-center gap-2 text-primary">
                      <User className="h-4 w-4" />
                      <h3 className="font-bold text-sm">Detalles Marcar como Invitado</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="custName" className="text-xs font-bold uppercase tracking-wider opacity-70">Nombre</Label>
                        <Input
                          id="custName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="h-11 rounded-xl bg-background border-border"
                          placeholder={`Nombre del ${t.client.toLowerCase()}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custPhone" className="text-xs font-bold uppercase tracking-wider opacity-70">Teléfono</Label>
                        <Input
                          id="custPhone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="h-11 rounded-xl bg-background border-border"
                          placeholder="Teléfono"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Services Selection */}
                <section className="space-y-4">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" /> {t.servicePlural} Seleccionados
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {services.map((s) => {
                      const isSelected = selectedServices.includes(s.id)
                      const isBlocked = activeCategory && !isSelected && (!s.categories || !s.categories.includes(activeCategory))

                      return (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-center space-x-3 rounded-xl border p-3 transition-all cursor-pointer relative",
                          isSelected
                            ? "bg-primary/10 border-primary ring-1 ring-primary/20"
                            : isBlocked
                            ? "border-border/50 bg-muted/30 opacity-50 pointer-events-none"
                            : "bg-card border-border hover:bg-muted/50"
                        )}
                        onClick={() => {
                          if (isBlocked) return;
                          setSelectedServices(prev =>
                            prev.includes(s.id)
                              ? prev.filter(id => id !== s.id)
                              : [...prev, s.id]
                          )
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => { }} // Handled by div click
                          className="h-5 w-5 rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">₡{s.price.toLocaleString()} • {s.duration}min</p>
                        </div>
                        {isBlocked && (
                          <p className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                            Distinta Cat.
                          </p>
                        )}
                      </div>
                    )})}
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Staff Selection */}
                <section className="space-y-4">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> {t.staff}
                  </Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger className="h-12 rounded-xl bg-card border-border shadow-sm">
                      <SelectValue placeholder={`Selecciona ${t.staff.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-card/95 backdrop-blur-md">
                      {staff.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="rounded-lg focus:bg-primary/10">
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>

                <Separator className="opacity-50" />

                {/* Date & Time Section */}
                <div className="grid sm:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <Label className="text-base font-bold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> Fecha
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal rounded-xl bg-card border-border shadow-sm",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4 opacity-50" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="p-3"
                        />
                      </PopoverContent>
                    </Popover>
                  </section>

                  <section className="space-y-4">
                    <Label className="text-base font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Hora
                    </Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime} disabled={isLoadingSlots || !selectedDate}>
                      <SelectTrigger className="h-12 rounded-xl bg-card border-border shadow-sm">
                        <SelectValue placeholder={isLoadingSlots ? "Cargando..." : "Elige hora"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] rounded-xl border-border bg-card/95 backdrop-blur-md">
                        {availableSlots.length === 0 && !isLoadingSlots ? (
                          <div className="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground italic">
                            <AlertCircle className="h-4 w-4" /> No hay horarios disponibles
                          </div>
                        ) : (
                          availableSlots.map((slot) => (
                            <SelectItem key={slot} value={slot} className="rounded-lg focus:bg-primary/10">
                              {convertTo12h(slot)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </section>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <SheetFooter className="p-6 sm:p-10 border-t border-border bg-card/50 backdrop-blur-sm sm:flex-row gap-3">
          {mode === "preview" ? (
            <>
              {/* Status Management */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full flex-1">
                {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") &&
                  (new Date(appointment.startTime) <= toCRDate(new Date())) && (
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 font-bold transition-all shadow-sm text-xs px-4 w-full sm:w-auto"
                      onClick={() => handleStatusUpdate("COMPLETED")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                      Completar
                    </Button>
                  )}
                {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") &&
                  (new Date(appointment.startTime) <= toCRDate(new Date())) && (
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 font-bold transition-all shadow-sm text-xs px-4 w-full sm:w-auto"
                      onClick={() => handleStatusUpdate("NO_SHOW")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                      No asistió
                    </Button>
                  )}
                {(appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && appointment.status !== "NO_SHOW" && !isPastOrPresent) && (
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300 font-bold transition-all shadow-sm text-xs px-4 w-full sm:w-auto"
                    onClick={() => handleStatusUpdate("CANCELLED")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                    Cancelar
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="h-12 rounded-xl font-bold text-muted-foreground w-full sm:w-auto"
                onClick={() => setMode("preview")}
                disabled={isUpdating}
              >
                <Undo2 className="mr-2 h-4 w-4" /> Descartar
              </Button>
              <Button
                className="h-12 rounded-xl bg-primary hover:primary font-bold shadow-lg shadow-primary/30 w-full sm:flex-1"
                onClick={handleSaveEdit}
                disabled={isUpdating || !isDirty}
              >
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Guardar Cambios
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>

    </Sheet>
  )
}
