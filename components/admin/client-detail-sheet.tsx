"use client"

import { useState, useEffect } from "react"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Tag, 
  ChevronRight, 
  Loader2, 
  History,
  TrendingUp,
  UserCheck
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
import { getClientDetails } from "@/app/[slug]/admin/clientes/actions"
import { formatTime } from "@/lib/date-utils"
import { AppointmentStatus } from "@prisma/client"
import { StatusBadge } from "./appointments/status-badge"
import { cn } from "@/lib/utils"

interface ClientDetailSheetProps {
  clientId: string | null
  shopId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  businessType: string
}

export function ClientDetailSheet({ 
  clientId, 
  shopId, 
  isOpen, 
  onOpenChange,
  businessType 
}: ClientDetailSheetProps) {
  const [loading, setLoading] = useState(false)
  const [clientData, setClientData] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      if (!clientId || !isOpen) return
      setLoading(true)
      try {
        const result = await getClientDetails(clientId, shopId)
        if (result.success) {
          setClientData(result.data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [clientId, shopId, isOpen])

  const appointments = clientData?.appointmentsAsCustomer || []
  const completedVisits = appointments.filter((a: any) => a.status === AppointmentStatus.COMPLETED).length
  const totalSpent = appointments.reduce((acc: number, app: any) => {
    if (app.status !== AppointmentStatus.COMPLETED) return acc
    const price = app.priceAtBooking ?? app.services?.reduce((sAcc: number, s: any) => sAcc + (s.price || 0), 0) ?? app.service?.price ?? 0
    return acc + price
  }, 0)

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-[100dvh] border-l border-border bg-background">
        <SheetHeader className="px-6 py-6 sm:px-10 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/20">
              {clientData?.name?.charAt(0) || <User className="h-8 w-8" />}
            </div>
            <div>
              <SheetTitle className="text-2xl font-black tracking-tight text-foreground">
                {clientData?.name || "Cargando..."}
              </SheetTitle>
              <SheetDescription className="font-medium text-muted-foreground">
                Perfil del Cliente y Historial
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-bold animate-pulse">Cargando información...</p>
            </div>
          ) : clientData ? (
            <div className="p-6 sm:p-10 space-y-10">
              {/* Contact Info */}
              <section className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3 w-3 text-primary" /> Correo Electrónico
                  </p>
                  <p className="font-bold text-foreground break-all">{clientData.email}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3 text-primary" /> Teléfono
                  </p>
                  <p className="font-bold text-foreground">{clientData.phone || "No registrado"}</p>
                </div>
              </section>

              {/* Stats Cards */}
              <section className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-2xl p-5 border-primary/10 bg-primary/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visitas completadas</p>
                  </div>
                  <p className="text-3xl font-black text-foreground">{completedVisits}</p>
                </div>
                <div className="glass-card rounded-2xl p-5 border-emerald-500/10 bg-emerald-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inversión</p>
                  </div>
                  <p className="text-3xl font-black text-foreground">
                    ₡{totalSpent.toLocaleString()}
                  </p>
                </div>
              </section>

              <Separator className="opacity-50" />

              {/* Appointment History */}
              <section className="space-y-6 pb-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <History className="h-5 w-5" />
                    <h3 className="font-black uppercase tracking-widest text-xs">Historial de Citas</h3>
                  </div>
                  <Badge variant="outline" className="rounded-lg font-black text-[10px]">
                    {appointments.length} TOTAL
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
                                {(app.serviceDetails as any[])?.length 
                                  ? (app.serviceDetails as any[]).map(s => s.name).join(", ") 
                                  : (app.services?.map((s: any) => s.name).join(", ") || app.service?.name)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-secondary text-secondary-foreground">
                              <User className="h-3 w-3" />
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Atendido por: <span className="text-foreground font-bold">{app.staff?.name || "Sin asignar"}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 px-6 rounded-[2rem] border border-dashed border-border/60 bg-muted/5">
                      <History className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="font-bold text-muted-foreground">Sin historial de citas</p>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-1">
                        Las citas del cliente aparecerán aquí
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
