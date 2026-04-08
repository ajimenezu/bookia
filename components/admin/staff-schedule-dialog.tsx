"use client"

import { useState, useTransition } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Clock, CalendarDays, Loader2 } from "lucide-react"
import { updateStaffSchedule, addStaffTimeOff } from "@/app/[slug]/admin/staff/actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Break {
  startTime: string
  endTime: string
}

interface DaySchedule {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isOpen: boolean
  breaks: Break[]
}

interface StaffScheduleDialogProps {
  shopId: string
  staffId: string
  staffName: string
  initialSchedules: DaySchedule[]
  initialTimeOff: any[]
  isOwner: boolean
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function StaffScheduleDialog({
  shopId,
  staffId,
  staffName,
  initialSchedules,
  initialTimeOff,
  isOwner
}: StaffScheduleDialogProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    DAYS.map((_, i) => {
      const existing = initialSchedules.find(s => s.dayOfWeek === i)
      return existing || { dayOfWeek: i, openTime: "08:00", closeTime: "17:00", isOpen: true, breaks: [] }
    })
  )
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState("weekly")

  // Time Off State
  const [timeOffData, setTimeOffData] = useState({
    startDate: new Date(),
    endDate: new Date(),
    startTime: "",
    endTime: "",
    isFullDay: true,
    type: "VACATION",
    note: ""
  })

  const handleSaveWeekly = () => {
    startTransition(async () => {
      try {
        await updateStaffSchedule(shopId, staffId, schedules)
        toast.success(isOwner ? "Horario actualizado y aprobado" : "Horario enviado para aprobación")
      } catch (e: any) {
        toast.error(e.message)
      }
    })
  }

  const handleAddTimeOff = () => {
    startTransition(async () => {
      try {
        await addStaffTimeOff(shopId, staffId, {
          ...timeOffData,
          startDate: timeOffData.startDate.toISOString(),
          endDate: timeOffData.endDate.toISOString(),
          startTime: timeOffData.isFullDay ? null : (timeOffData.startTime || null),
          endTime: timeOffData.isFullDay ? null : (timeOffData.endTime || null)
        })
        toast.success(isOwner ? "Tiempo libre registrado" : "Solicitud de tiempo libre enviada")
      } catch (e: any) {
        toast.error(e.message)
      }
    })
  }

  const updateDay = (dayIndex: number, data: Partial<DaySchedule>) => {
    setSchedules(prev => prev.map((s, i) => i === dayIndex ? { ...s, ...data } : s))
  }

  const addBreak = (dayIndex: number) => {
    setSchedules(prev => prev.map((s, i) => 
      i === dayIndex 
        ? { ...s, breaks: [...s.breaks, { startTime: "12:00", endTime: "13:00" }] } 
        : s
    ))
  }

  const removeBreak = (dayIndex: number, breakIndex: number) => {
    setSchedules(prev => prev.map((s, i) => 
      i === dayIndex 
        ? { ...s, breaks: s.breaks.filter((_, bi) => bi !== breakIndex) } 
        : s
    ))
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          Configurar Horario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-border bg-background shadow-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:border-none [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 transition-colors">
        <div className="p-6 sm:p-10 pb-0">
          <DialogHeader>
          <DialogTitle>Horario de {staffName}</DialogTitle>
          <DialogDescription>
            Configura tus horas de trabajo, descansos y vacaciones.
            {!isOwner && " Los cambios requieren la aprobación del propietario."}
          </DialogDescription>
        </DialogHeader>
      </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 flex-1 flex flex-col min-h-0">
          <div className="px-6 sm:px-10">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly">Horario Semanal</TabsTrigger>
              <TabsTrigger value="timeoff">Ausencias / Vacaciones</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="weekly" className="space-y-6 pt-4">
            <div className="space-y-4 px-6 sm:px-10 pb-6">
              {schedules.map((day, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold", !day.isOpen && "text-muted-foreground")}>{DAYS[idx]}</span>
                      {!day.isOpen && <Badge variant="secondary">Cerrado</Badge>}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => updateDay(idx, { isOpen: !day.isOpen })}
                      className={day.isOpen ? "text-destructive" : "text-primary"}
                    >
                      {day.isOpen ? "Marcar como Cerrado" : "Marcar como Abierto"}
                    </Button>
                  </div>

                  {day.isOpen && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Entrada</Label>
                          <Input 
                            type="time" 
                            value={day.openTime || ""} 
                            onChange={(e) => updateDay(idx, { openTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Salida</Label>
                          <Input 
                            type="time" 
                            value={day.closeTime || ""} 
                            onChange={(e) => updateDay(idx, { closeTime: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Descansos / Almuerzo</Label>
                          <Button variant="ghost" size="sm" onClick={() => addBreak(idx)} className="h-7 text-xs gap-1">
                            <Plus className="h-3 w-3" /> Añadir descanso
                          </Button>
                        </div>
                        {day.breaks.map((brk, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-2">
                            <Input 
                              type="time" 
                              className="h-8 text-xs" 
                              value={brk.startTime}
                              onChange={(e) => {
                                const newBreaks = [...day.breaks]
                                newBreaks[bIdx].startTime = e.target.value
                                updateDay(idx, { breaks: newBreaks })
                              }}
                            />
                            <span className="text-muted-foreground">a</span>
                            <Input 
                              type="time" 
                              className="h-8 text-xs"
                              value={brk.endTime}
                              onChange={(e) => {
                                const newBreaks = [...day.breaks]
                                newBreaks[bIdx].endTime = e.target.value
                                updateDay(idx, { breaks: newBreaks })
                              }}
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBreak(idx, bIdx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur-md px-6 py-4 sm:px-10 border-t border-border z-10 shadow-sm">
              <Button onClick={handleSaveWeekly} disabled={isPending} className="w-full sm:w-auto font-bold shadow-lg shadow-primary/20">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Horario Semanal
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="timeoff" className="space-y-6 pt-4 px-6 sm:px-10 pb-10">
            <div className="rounded-xl border border-border p-5 space-y-5 bg-card shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
                <CalendarDays className="h-4 w-4" /> Solicitar Nueva Ausencia
              </h3>
              
              <div className="grid gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Desde</Label>
                    <Input 
                      type="date" 
                      className="bg-background"
                      value={timeOffData.startDate.toISOString().split('T')[0]}
                      onChange={(e) => setTimeOffData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Hasta</Label>
                    <Input 
                      type="date" 
                      className="bg-background"
                      value={timeOffData.endDate.toISOString().split('T')[0]}
                      onChange={(e) => setTimeOffData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Motivo</Label>
                    <select 
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                      value={timeOffData.type}
                      onChange={(e) => setTimeOffData(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="VACATION">Vacaciones</option>
                      <option value="PERSONAL">Motivo Personal</option>
                      <option value="SICK">Enfermedad</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between space-x-2 h-10 px-3 rounded-lg border border-border/60 bg-muted/30">
                    <Label htmlFor="full-day" className="text-xs font-medium cursor-pointer">Todo el día</Label>
                    <Switch 
                      id="full-day"
                      checked={timeOffData.isFullDay}
                      onCheckedChange={(checked) => setTimeOffData(prev => ({ ...prev, isFullDay: checked }))}
                    />
                  </div>
                </div>

                {!timeOffData.isFullDay && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Hora Inicio</Label>
                      <Input 
                        type="time" 
                        required
                        className="bg-background"
                        value={timeOffData.startTime}
                        onChange={(e) => setTimeOffData(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Hora Fin</Label>
                      <Input 
                        type="time" 
                        required
                        className="bg-background"
                        value={timeOffData.endTime}
                        onChange={(e) => setTimeOffData(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Nota adicional (Opcional)</Label>
                  <Input 
                    placeholder="Ej: Trámite dental por la mañana"
                    className="bg-background"
                    value={timeOffData.note}
                    onChange={(e) => setTimeOffData(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleTimeOffSubmit} disabled={isPending} className="w-full font-bold shadow-md active:scale-[0.98] transition-all">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isOwner ? "Registrar Ausencia" : "Enviar Solicitud"}
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Historial de Ausencias</h3>
              {initialTimeOff.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  No hay ausencias registradas
                </p>
              ) : (
                <div className="space-y-2">
                  {initialTimeOff.map((to, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs">
                      <div>
                        <p className="font-bold">{new Date(to.startDate).toLocaleDateString()} - {new Date(to.endDate).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">{to.type} {to.note && `• ${to.note}`}</p>
                      </div>
                      <Badge variant={to.status === 'APPROVED' ? 'default' : to.status === 'REJECTED' ? 'destructive' : 'outline'}>
                        {to.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )

  function handleTimeOffSubmit() {
    handleAddTimeOff()
  }
}
