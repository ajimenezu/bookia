"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Tag, 
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getClientDetails, getClientAppointments } from "@/app/[slug]/admin/clientes/actions"
import { AppointmentStatus } from "@prisma/client"
import { getTerminology } from "@/lib/dictionaries"
import { calculateAppointmentPrice } from "@/lib/appointments"
import { ClientAppointmentCard } from "./client-appointment-card"

interface ClientDetailSheetProps {
  clientId: string | null
  shopId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  businessType: string
}

const APPOINTMENTS_PER_PAGE = 5

export function ClientDetailSheet({ 
  clientId, 
  shopId, 
  isOpen, 
  onOpenChange,
  businessType 
}: ClientDetailSheetProps) {
  const [loading, setLoading] = useState(false)
  const [clientData, setClientData] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  const t = getTerminology(businessType as any)

  // Load initial client info and first 5 appointments
  useEffect(() => {
    async function loadData() {
      if (!clientId || !isOpen) return
      setLoading(true)
      try {
        const result = await getClientDetails(clientId, shopId)
        if (result.success && result.data) {
          setClientData(result.data)
          // The initial data already includes the first 5 appointments
          const initialApps = (result.data as any).appointmentsAsCustomer || []
          setAppointments(initialApps)
          setPage(1)
          setHasMore(initialApps.length === APPOINTMENTS_PER_PAGE)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [clientId, shopId, isOpen])

  const loadMoreAppointments = useCallback(async () => {
    if (loadingMore || !hasMore || !clientId) return
    
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const result = await getClientAppointments(clientId, shopId, nextPage, APPOINTMENTS_PER_PAGE)
      if (result.success && result.data) {
        const newApps = result.data || []
        if (newApps.length === 0) {
          setHasMore(false)
        } else {
          setAppointments(prev => {
            // Avoid duplicates just in case
            const existingIds = new Set(prev.map(a => a.id))
            const filteredNew = newApps.filter((a: any) => !existingIds.has(a.id))
            return [...prev, ...filteredNew]
          })
          setPage(nextPage)
          setHasMore(newApps.length === APPOINTMENTS_PER_PAGE)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingMore(false)
    }
  }, [clientId, shopId, page, hasMore, loadingMore])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreAppointments()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadMoreAppointments])

  // Stats calculation
  const completedVisits = clientData?.appointmentsAsCustomer?.filter((a: any) => a.status === AppointmentStatus.COMPLETED).length || 0
  const totalSpent = clientData?.appointmentsAsCustomer?.reduce((acc: number, app: any) => {
    if (app.status !== AppointmentStatus.COMPLETED) return acc
    return acc + calculateAppointmentPrice(app)
  }, 0) || 0

  // Function to refresh a specific appointment's data (e.g. after adding a note)
  const handleAppointmentUpdate = async () => {
    // For now, we'll just re-fetch the current page range to keep it simple and consistent
    // In a more complex app, we might only fetch the single updated appointment
    if (!clientId) return
    try {
      const allFetchedApps = []
      for (let p = 1; p <= page; p++) {
        const result = await getClientAppointments(clientId, shopId, p, APPOINTMENTS_PER_PAGE)
        if (result.success) {
          allFetchedApps.push(...(result.data || []))
        }
      }
      setAppointments(allFetchedApps)
    } catch (error) {
      console.error("Error refreshing appointments:", error)
    }
  }

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

        <ScrollArea className="flex-1 min-h-0">
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
                    <h3 className="font-black uppercase tracking-widest text-xs">{t.appointmentHistory}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {appointments.length > 0 ? (
                    <>
                      {appointments.map((app: any) => (
                        <ClientAppointmentCard 
                          key={app.id} 
                          appointment={app} 
                          shopId={shopId} 
                          onUpdate={handleAppointmentUpdate}
                        />
                      ))}
                      
                      {/* Infinite Scroll Trigger */}
                      <div ref={observerTarget} className="h-10 flex items-center justify-center">
                        {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary/50" />}
                      </div>
                    </>
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
