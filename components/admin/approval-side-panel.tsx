"use client"

import { useState, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Calendar, Clock, AlertCircle, Info } from "lucide-react"
import { processRequest } from "@/app/[slug]/admin/staff/actions"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"



interface ApprovalSidePanelProps {
  shopId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRequests: {
    schedules: any[]
    timeOff: any[]
  }
}

export function ApprovalSidePanel({
  shopId,
  open,
  onOpenChange,
  initialRequests
}: ApprovalSidePanelProps) {
  const [isPending, startTransition] = useTransition()
  const [requests, setRequests] = useState(initialRequests)

  const handleAction = (type: "SCHEDULE" | "TIMEOFF", id: string, action: "APPROVE" | "REJECT") => {
    startTransition(async () => {
      try {
        await processRequest(shopId, type, id, action)
        toast.success(action === "APPROVE" ? "Solicitud aprobada" : "Solicitud rechazada")
        
        // Optimistic UI update
        if (type === "SCHEDULE") {
          setRequests(prev => ({ ...prev, schedules: prev.schedules.filter(s => s.id !== id) }))
        } else {
          setRequests(prev => ({ ...prev, timeOff: prev.timeOff.filter(s => s.id !== id) }))
        }
      } catch (e: any) {
        toast.error(e.message)
      }
    })
  }

  const hasRequests = requests.schedules.length > 0 || requests.timeOff.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Solicitudes Pendientes
          </SheetTitle>
          <SheetDescription>
            Revisa y aprueba los cambios de horario y ausencias de tu equipo.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {!hasRequests ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                <Check className="h-6 w-6" />
              </div>
              <p className="font-medium text-muted-foreground">No hay solicitudes pendientes</p>
              <p className="text-xs text-muted-foreground/60 mt-1">¡Tu equipo está al día!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Schedules */}
              {requests.schedules.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Horarios Semanales
                  </h3>
                  {requests.schedules.map((s) => (
                    <div key={s.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {s.staff.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{s.staff.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">{getDayName(s.dayOfWeek)}</p>
                        </div>
                      </div>
                      <div className="text-sm bg-muted/30 rounded-lg p-2 border border-border/50">
                        <p className="flex items-center justify-between">
                          <span className="text-muted-foreground">Horario:</span>
                          <span className="font-semibold">{s.isOpen ? `${s.openTime} - ${s.closeTime}` : "Cerrado"}</span>
                        </p>
                        {s.breaks.length > 0 && (
                          <div className="mt-1 pt-1 border-t border-border/30">
                            <p className="text-[10px] text-muted-foreground mb-1 font-bold">Descansos:</p>
                            {s.breaks.map((b: any, bi: number) => (
                              <p key={bi} className="text-[11px] font-medium flex items-center gap-1">
                                • {b.startTime} - {b.endTime}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 h-8 bg-success hover:bg-success/90 text-success-foreground" 
                          onClick={() => handleAction("SCHEDULE", s.id, "APPROVE")}
                          disabled={isPending}
                        >
                          Aprobar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-8 text-destructive border-destructive/20 hover:bg-destructive/10" 
                          onClick={() => handleAction("SCHEDULE", s.id, "REJECT")}
                          disabled={isPending}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {requests.schedules.length > 0 && requests.timeOff.length > 0 && <Separator />}

              {/* Time Off */}
              {requests.timeOff.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Ausencias y Vacaciones
                  </h3>
                  {requests.timeOff.map((to) => (
                    <div key={to.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {to.staff.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{to.staff.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase">{to.type}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm bg-muted/30 rounded-lg p-2 border border-border/50">
                        <p className="font-semibold text-xs flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-primary" />
                          {new Date(to.startDate).toLocaleDateString()} al {new Date(to.endDate).toLocaleDateString()}
                        </p>
                        {to.note && (
                          <p className="text-[11px] text-muted-foreground mt-1 italic flex items-center gap-1">
                            <Info className="h-2.5 w-2.5" /> "{to.note}"
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 h-8 bg-success hover:bg-success/90 text-success-foreground" 
                          onClick={() => handleAction("TIMEOFF", to.id, "APPROVE")}
                          disabled={isPending}
                        >
                          Aprobar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-8 text-destructive border-destructive/20 hover:bg-destructive/10" 
                          onClick={() => handleAction("TIMEOFF", to.id, "REJECT")}
                          disabled={isPending}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function getDayName(day: number) {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  return days[day]
}
