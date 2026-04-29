"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  User,
  Tag,
  Phone,
  CreditCard,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Save,
  Undo2,
  X,
  Trash2,
  MessageSquare
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
import { formatTime, toCRDate } from "@/lib/date-utils"
import { updateAppointmentStatus, updateBooking, fetchAvailableSlots, addAppointmentNote, deleteAppointmentNote } from "@/app/schedule/actions"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AppointmentDetailSheetProps {
  appointment: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  businessType: BusinessType
  services: { id: string; name: string; price: number; duration: number }[]
  staff: { id: string; name: string }[]
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
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null)

  // Initialize form state when entering edit mode or when appointment changes
  useEffect(() => {
    if (appointment && isOpen) {
      const apptDate = new Date(appointment.startTime)
      setSelectedServices(appointment.services?.map((s: any) => s.id) || (appointment.serviceId ? [appointment.serviceId] : []))
      setSelectedStaff(appointment.staffId || "")
      setSelectedDate(apptDate)
      setSelectedTime(formatTime(appointment.startTime).split(' ')[0]) // Get HH:MM
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
    setIsSavingNotes(true)
    try {
      const result = await addAppointmentNote({ 
        appointmentId: appointment.id, 
        content: notes, 
        shopId 
      })
      if (result.success) {
        toast.success("Nota agregada")
        setNotes("")
        router.refresh()
      } else {
        toast.error(result.error || "Error al agregar nota")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!noteToDeleteId) return
    try {
      const result = await deleteAppointmentNote({ noteId: noteToDeleteId, shopId })
      if (result.success) {
        toast.success("Nota eliminada")
        router.refresh()
      } else {
        toast.error(result.error || "Error al eliminar nota")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setNoteToDeleteId(null)
    }
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

  const totalPrice = useMemo(() => {
    if (!appointment) return 0
    if (mode === "preview") {
      if (appointment.services?.length > 0) {
        return appointment.services.reduce((acc: number, s: any) => acc + (s.price || 0), 0)
      }
      return appointment.priceAtBooking || appointment.service?.price || 0
    } else {
      return services
        .filter(s => selectedServices.includes(s.id))
        .reduce((acc, s) => acc + s.price, 0)
    }
  }, [appointment, mode, selectedServices, services])

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
                    {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status) && !isPastOrPresent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg font-bold border-primary/10 text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => setMode("edit")}
                      >
                        <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Editar
                      </Button>
                    )}
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

                <Separator className="opacity-50" />

                {/* Services & Staff Section */}
                <section className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Tag className="h-4 w-4" />
                      <h3 className="font-bold">{t.servicePlural}</h3>
                    </div>
                    <div className="space-y-2">
                      {appointment.services?.length > 0 ? (
                        appointment.services.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 border border-border/50">
                            <span className="text-sm font-medium">{s.name}</span>
                            <span className="text-xs font-bold text-primary">₡{s.price.toLocaleString()}</span>
                          </div>
                        ))
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
                    <MessageSquare className="h-4 w-4" />
                    <h3 className="font-bold">Historial de Notas</h3>
                  </div>
                  
                  {/* New Note Form (Top) */}
                  <div className="space-y-3 bg-primary/5 rounded-2xl p-4 border border-primary/10">
                    <textarea
                      className="w-full min-h-[80px] rounded-xl border border-border bg-background p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                      placeholder="Escribe una nueva nota..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-8 px-3 text-muted-foreground font-bold"
                        onClick={() => setNotes("")}
                        disabled={!notes.trim() || isSavingNotes}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-lg h-8 px-4 font-bold"
                        onClick={handleAddNote}
                        disabled={!notes.trim() || isSavingNotes}
                      >
                        {isSavingNotes ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3 w-3 mr-1.5" />}
                        Guardar Nota
                      </Button>
                    </div>
                  </div>

                  {/* Notes List (Bottom) */}
                  <div className="space-y-4">
                    {appointment.notes && appointment.notes.length > 0 ? (
                      appointment.notes.map((note: { id: string; content: string; createdAt: string; author?: { name: string | null; email: string | null } }) => (
                        <div key={note.id} className="group relative rounded-2xl border border-border bg-card/30 p-4 shadow-sm hover:border-primary/20 transition-all">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                {note.author?.name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground">
                                  {note.author?.name || note.author?.email?.split('@')[0] || "Usuario"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: es })}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-all"
                              onClick={() => setNoteToDeleteId(note.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-border/60">
                        <p className="text-xs text-muted-foreground italic">No hay notas registradas para esta cita.</p>
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
                    {services.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-center space-x-3 rounded-xl border p-3 transition-all cursor-pointer",
                          selectedServices.includes(s.id)
                            ? "bg-primary/10 border-primary ring-1 ring-primary/20"
                            : "bg-card border-border hover:bg-muted/50"
                        )}
                        onClick={() => {
                          setSelectedServices(prev =>
                            prev.includes(s.id)
                              ? prev.filter(id => id !== s.id)
                              : [...prev, s.id]
                          )
                        }}
                      >
                        <Checkbox
                          checked={selectedServices.includes(s.id)}
                          onCheckedChange={() => { }} // Handled by div click
                          className="h-5 w-5 rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">₡{s.price.toLocaleString()} • {s.duration}min</p>
                        </div>
                      </div>
                    ))}
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
                              {slot}
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
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Guardar Cambios
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>

      <AlertDialog open={!!noteToDeleteId} onOpenChange={(open) => !open && setNoteToDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-border bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">¿Eliminar esta nota?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. La nota se eliminará permanentemente de los registros de esta cita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-border font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20"
            >
              Eliminar Nota
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}
