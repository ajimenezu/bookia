"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, XCircle, CheckCircle2, ChevronDown } from "lucide-react"
import { updateAppointmentStatus } from "@/app/schedule/actions"
import { AppointmentStatus } from "@prisma/client"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
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
import { StatusBadge } from "./status-badge"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toCRDate } from "@/lib/date-utils"

interface AppointmentActionsProps {
  appointmentId: string
  shopId: string
  currentStatus: AppointmentStatus
  startTime: Date | string
  className?: string
}

export function AppointmentActions({ appointmentId, shopId, currentStatus, startTime, className }: AppointmentActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<AppointmentStatus | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const handleStatusUpdate = async (newStatus: AppointmentStatus) => {
    setLoading(newStatus)
    try {
      const result = await updateAppointmentStatus(appointmentId, newStatus, shopId)
      const statusLabels: Record<string, string> = {
        COMPLETED: "completada",
        CONFIRMED: "confirmada",
        CANCELLED: "cancelada",
        NO_SHOW: "marcada como no asistió"
      }
      if (result.success) {
        toast.success(`Cita ${statusLabels[newStatus] || newStatus.toLowerCase()} con éxito`)
        router.refresh()
      } else {
        toast.error(result.error || "Ocurrió un error")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error de conexión al servidor")
    } finally {
      setLoading(null)
    }
  }

  const isPastOrPresent = new Date(startTime) <= toCRDate(new Date())
  const isFinalStatus = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(currentStatus)
  const isInteractive = !loading && !isFinalStatus

  return (
    <>
      <div className={cn("inline-flex items-center", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={!isInteractive}>
            <button className={cn(
              "group relative transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-100",
              className?.includes("w-full") && "w-full",
              isInteractive && "cursor-pointer"
            )}>
              <StatusBadge status={currentStatus} className={cn(className?.includes("w-full") && "w-full justify-center", "py-1")}>
                {isInteractive && (
                  <ChevronDown className="h-3.5 w-3.5 text-current opacity-70 transition-opacity group-hover:opacity-100" />
                )}
              </StatusBadge>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-full">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            className="w-[var(--radix-dropdown-menu-trigger-width)] p-1.5 bg-card/95 backdrop-blur-sm border-border shadow-2xl rounded-xl"
          >
            {isPastOrPresent && (
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("COMPLETED")}
                className="cursor-pointer focus:bg-transparent p-1"
              >
                <Badge className="w-full flex items-center justify-start gap-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 py-2 px-3 transition-colors">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold">Completar</span>
                </Badge>
              </DropdownMenuItem>
            )}

            {currentStatus === "PENDING" && (
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("CONFIRMED")}
                className="cursor-pointer focus:bg-transparent p-1"
              >
                <Badge className="w-full flex items-center justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 py-2 px-3 transition-colors">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-semibold">Confirmar</span>
                </Badge>
              </DropdownMenuItem>
            )}

            {isPastOrPresent && (
              <DropdownMenuItem
                onClick={() => handleStatusUpdate("NO_SHOW")}
                className="cursor-pointer focus:bg-transparent p-1"
              >
                <Badge className="w-full flex items-center justify-start gap-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 py-2 px-3 transition-colors">
                  <XCircle className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold">No asistió</span>
                </Badge>
              </DropdownMenuItem>
            )}

            {!isPastOrPresent && (
              <DropdownMenuItem
                onSelect={() => setShowCancelDialog(true)}
                className="cursor-pointer focus:bg-transparent p-1"
              >
                <Badge className="w-full flex items-center justify-start gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 py-2 px-3 transition-colors">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-semibold">Cancelar</span>
                </Badge>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="max-w-[400px] border-border bg-card/95 backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">¿Cancelar cita?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground pt-2">
              Esta acción no se puede deshacer. El cliente recibirá una notificación de cancelación si tienes los servicios configurados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto border-border bg-muted/50 hover:bg-muted">Cerrar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusUpdate("CANCELLED")}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
