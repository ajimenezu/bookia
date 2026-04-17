"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { UserCheck, CalendarDays, CheckCircle2, Loader2, LogIn, UserPlus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { es } from "date-fns/locale"
import { fetchAvailableSlots, createBooking, getAvailableStaffForSlot } from "@/app/schedule/actions"
import { BusinessType, getTerminology } from "@/lib/dictionaries"
import { getBusinessIcon } from "@/lib/business-icons"

interface ServiceData {
  id: string
  name: string
  price: number
  duration: number
  description: string | null
}

interface StaffData {
  id: string
  name: string
}

interface ClientData {
  id: string
  name: string
  phone: string | null
}

interface BookingFlowProps {
  shopId: string
  shopName: string
  shopSlug: string
  businessType?: BusinessType
  whatsappPhone: string | null
  services: ServiceData[]
  staff: StaffData[]
  initialClientName?: string
  initialClientPhone?: string
  hideHeader?: boolean
  isAdmin?: boolean
  clients?: ClientData[]
  shopSchedules?: {
    dayOfWeek: number
    closeTime: string
    isOpen: boolean
  }[]
  initialServiceId?: string
}

type Step = "service" | "barber" | "date" | "time" | "info"
export function BookingFlow({
  shopId,
  shopName,
  shopSlug,
  businessType,
  whatsappPhone,
  services,
  staff,
  initialClientName,
  initialClientPhone,
  hideHeader = false,
  isAdmin = false,
  clients = [],
  shopSchedules = [],
  initialServiceId
}: BookingFlowProps) {
  const t = getTerminology(businessType)
  const BusinessIcon = getBusinessIcon(businessType)
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialServiceId ? [initialServiceId] : []
  )
  const [isServiceStepDone, setIsServiceStepDone] = useState(false)
  const [selectedBarber, setSelectedBarber] = useState<string | null>(
    staff.length === 1 ? staff[0].id : null
  )
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState(initialClientName || "")
  const [clientPhone, setClientPhone] = useState(initialClientPhone || "")
  const [clientType, setClientType] = useState<"registered" | "unregistered">(isAdmin ? "registered" : "unregistered")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [touched, setTouched] = useState({ name: false, phone: false })
  const [showConfirmation, setShowConfirmation] = useState(false)

  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [assignedAutoStaff, setAssignedAutoStaff] = useState<{ id: string; name: string } | null>(null)
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [bookingError, setBookingError] = useState<string | null>(null)
  const currentStep: Step = !isServiceStepDone
    ? "service"
    : !selectedBarber
      ? "barber"
      : !selectedDate
        ? "date"
        : !selectedTime
          ? "time"
          : "info"

  // 1. Persistence Logic
  const saveBookingState = useCallback((step?: Step) => {
    const state = {
      shopId,
      selectedServices,
      selectedBarber,
      selectedDate: selectedDate?.toISOString(),
      selectedTime,
      step: step || currentStep,
      isServiceStepDone: step === 'barber' || isServiceStepDone,
      createdAt: Date.now() // Add timestamp for TTL
    }
    localStorage.setItem(`pending_booking_${shopId}`, JSON.stringify(state))
  }, [shopId, selectedServices, selectedBarber, selectedDate, selectedTime, currentStep, isServiceStepDone])

  const [, setIsRestoringState] = useState(false)

  const clearBookingState = useCallback(() => {
    localStorage.removeItem(`pending_booking_${shopId}`)
  }, [shopId])

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(`pending_booking_${shopId}`)
    if (saved) {
      try {
        const state = JSON.parse(saved)

        // TTL Check: 15 minutes (15 * 60 * 1000 ms)
        const expirationTime = 15 * 60 * 1000
        const isExpired = !state.createdAt || (Date.now() - state.createdAt > expirationTime)

        if (isExpired) {
          localStorage.removeItem(`pending_booking_${shopId}`)
          return
        }

        setIsRestoringState(true)
        if (state.selectedServices) {
          const restored = state.selectedServices as string[]
          if (initialServiceId && !restored.includes(initialServiceId)) {
            setSelectedServices([...restored, initialServiceId])
          } else {
            setSelectedServices(restored)
          }
        }

        // If we have a new initialServiceId, we should stay on the service step 
        // to show the user what's selected even if they were further in a previous session
        if (initialServiceId) {
          setIsServiceStepDone(false)
        } else if (state.isServiceStepDone) {
          setIsServiceStepDone(true)
        }

        if (state.selectedBarber) setSelectedBarber(state.selectedBarber)
        if (state.selectedDate) setSelectedDate(new Date(state.selectedDate))
        if (state.selectedTime) setSelectedTime(state.selectedTime)

        // Final cleanup after state is applied
        setTimeout(() => {
          setIsRestoringState(false)
        }, 100)
      } catch (e) {
        console.error("Failed to restore booking state", e)
        localStorage.removeItem(`pending_booking_${shopId}`)
        setIsRestoringState(false)
      }
    }
  }, [shopId])

  const handleAuthRedirect = (type: 'login' | 'register') => {
    saveBookingState()
    const path = type === 'login' ? 'login' : 'register'
    window.location.href = `/${shopSlug}/${path}`
  }

  const stepNumber = { service: 1, barber: 2, date: 3, time: 4, info: 5 }

  // Format price to local currency
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(price).replace("CRC", "₡")

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  // When date is selected, fetch available slots
  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime(null)

    if (date && selectedBarber) {
      setLoadingSlots(true)
      try {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const slots = await fetchAvailableSlots(shopId, selectedBarber, dateStr)
        setAvailableSlots(slots)
      } catch (error) {
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
  }

  const handleConfirm = () => {
    if (!clientName || !clientPhone || selectedServices.length === 0 || !selectedBarber || !selectedDate || !selectedTime) return

    setBookingError(null)
    startTransition(async () => {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      const result = await createBooking({
        shopId,
        serviceIds: selectedServices,
        staffId: selectedBarber === "auto" && assignedAutoStaff ? assignedAutoStaff.id : selectedBarber,
        date: dateStr,
        time: selectedTime,
        customerName: clientName,
        customerPhone: clientPhone,
        ...(isAdmin ? { isAdminBooking: true, customerId: clientType === 'registered' ? selectedClientId || undefined : undefined } : {})
      })

      if (result.success) {
        setShowConfirmation(true)
        clearBookingState()
      } else {
        setBookingError(result.error || "Error al crear la reserva")
      }
    })
  }

  const handleReset = () => {
    setSelectedServices([])
    setIsServiceStepDone(false)
    setSelectedBarber(staff.length === 1 ? staff[0].id : null)
    setSelectedDate(undefined)
    setSelectedTime(null)
    setClientName(initialClientName || "")
    setClientPhone(initialClientPhone || "")
    setTouched({ name: false, phone: false })
    setShowConfirmation(false)
    setBookingError(null)
    setAvailableSlots([])
    setAssignedAutoStaff(null)
    clearBookingState()
  }

  // Add "auto" option to staff list only if there are multiple staff members
  const allStaff = staff.length > 1
    ? [{ id: "auto", name: "Asignación automática" }, ...staff]
    : staff

  const selectedServicesDetails = services.filter((s) => selectedServices.includes(s.id))
  const totalPrice = selectedServicesDetails.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServicesDetails.reduce((sum, s) => sum + s.duration, 0)
  const barber = allStaff.find((b) => b.id === selectedBarber)

  return (
    <div className={cn(!hideHeader && "min-h-screen bg-background")}>
      {!hideHeader && (
        <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
          <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <BusinessIcon className="h-4.5 w-4.5" />
              </div>
              <span className="text-xl font-black text-foreground tracking-tight">BookIA</span>
            </Link>

            {initialClientName && (
              <div className="flex items-center gap-2.5 bg-muted/20 px-3 py-1.5 rounded-full border border-border/40">
                <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
                  {initialClientName.split(' ')[0]}
                </span>
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-[10px] shadow-sm">
                  {initialClientName.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      <main className="mx-auto max-w-lg px-6 py-10">
        {/* Shop name */}
        <div className="mb-10 text-center space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tight">{shopName}</h1>
          <p className="text-muted-foreground font-medium text-sm">Agenda tu {t.appointment.toLowerCase()} en segundos</p>
        </div>

        {/* Progress */}
        <div className="mb-12 flex items-center justify-center gap-3">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={cn(
                "h-2 rounded-full transition-all duration-500 shadow-inner",
                step === stepNumber[currentStep] ? "w-12 bg-primary" : step < stepNumber[currentStep] ? "w-6 bg-primary/40" : "w-6 bg-secondary"
              )}
            />
          ))}
        </div>

        {/* Step: Service Selection */}
        {currentStep === "service" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="mb-6 text-xl font-black text-foreground tracking-tight">Selecciona tus {t.servicePlural.toLowerCase()}</h2>
            <div className="grid gap-4">
              {services.map((svc) => {
                const isSelected = selectedServices.includes(svc.id)
                return (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setSelectedServices(prev =>
                        isSelected ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                      )
                    }}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border p-5 text-left transition-all cursor-pointer relative shadow-sm active:scale-[0.98]",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-300",
                      isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" : "bg-primary/5 text-primary"
                    )}>
                      {isSelected ? <CheckCircle2 className="h-7 w-7" /> : <BusinessIcon className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-card-foreground text-lg leading-tight truncate">{svc.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                        <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded-md">{formatDuration(svc.duration)}</span>
                      </div>

                      {/* Animated Description Expansion */}
                      {svc.description && (
                        <div className={cn(
                          "grid transition-all duration-500 ease-in-out",
                          isSelected ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
                        )}>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed border-t border-primary/10 pt-3">
                              {svc.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-primary tracking-tighter">{formatPrice(svc.price)}</span>
                    </div>
                  </button>
                )
              })}
              {services.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">No hay {t.servicePlural.toLowerCase()} disponibles</p>
              )}
            </div>
            {whatsappPhone && (
              <a
                href={`https://wa.me/${whatsappPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="mt-4 w-full h-12 rounded-xl text-base">
                  No estoy seguro, quiero preguntar por WhatsApp
                </Button>
              </a>
            )}

            <div className="sticky bottom-0 z-20 -mx-6 mt-auto">
              {/* Gradient overlay to blend services as they scroll under the footer */}
              <div className="h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />

              <div className="bg-background border-t border-border/40 px-6 pb-12 pt-2 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-[0.15em]">Seleccionados</span>
                    <span className="text-sm font-bold text-foreground">
                      {selectedServices.length} {selectedServices.length === 1 ? t.service.toLowerCase() : t.servicePlural.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-[0.15em]">Total</span>
                    <span className="text-xl font-black text-primary tracking-tighter">
                      {totalPrice > 0 ? formatPrice(totalPrice) : '—'}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/25 active:scale-[0.98] transition-all bg-primary hover:bg-primary/95"
                  onClick={() => setIsServiceStepDone(true)}
                  disabled={selectedServices.length === 0}
                >
                  {isAdmin ? "Continuar" : "Continuar sin cuenta"}
                </Button>

                {!initialClientName && !isAdmin && (
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-border/40" />
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 font-black">o guarda tu sesión</span>
                      <span className="h-px flex-1 bg-border/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl text-xs font-bold gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                        onClick={() => handleAuthRedirect('login')}
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        Acceder
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl text-xs font-bold gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                        onClick={() => handleAuthRedirect('register')}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Crear cuenta
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Step: Staff Selection */}
        {currentStep === "barber" && (
          <section className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="mb-6 text-xl font-black text-foreground tracking-tight">Elige {t.staffGender === "f" ? "una" : "un"} {t.staff}</h2>
            <div className="grid gap-4">
              {allStaff.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBarber(b.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-5 text-left transition-all cursor-pointer shadow-sm active:scale-[0.98]",
                    selectedBarber === b.id
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  {b.id === "auto" ? (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse">
                      <UserCheck className="h-7 w-7" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-black text-secondary-foreground shadow-inner border border-border/40 uppercase">
                      {b.name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("")}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-card-foreground text-lg leading-tight truncate">{b.name}</p>
                    {b.id === "auto" && (
                      <p className="text-xs font-medium text-muted-foreground mt-1">{t.staffGender === "f" ? "Primera" : "Primer"} {t.staff} disponible</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-6 w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border-border/60"
              onClick={() => { setIsServiceStepDone(false); setSelectedBarber(null) }}
            >
              Volver
            </Button>
          </section>
        )}

        {/* Step: Date Selection */}
        {currentStep === "date" && (
          <section className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="mb-6 text-xl font-black text-foreground tracking-tight">¿Cuándo vienes?</h2>
            <div className="mx-auto w-full max-w-[350px] rounded-3xl border border-border/60 bg-card p-4 shadow-xl shadow-black/5 ring-1 ring-black/5">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={es}
                disabled={(date) => {
                  const crNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }))
                  const isToday =
                    crNow.getFullYear() === date.getFullYear() &&
                    crNow.getMonth() === date.getMonth() &&
                    crNow.getDate() === date.getDate()

                  // 1. Past dates are always disabled
                  if (date < new Date(crNow.setHours(0, 0, 0, 0))) return true

                  // 2. Dynamic availability check based on shop schedules
                  const daySchedule = shopSchedules.find(s => s.dayOfWeek === date.getDay())

                  // If day is explicitly marked as closed, disable it
                  if (daySchedule && !daySchedule.isOpen) return true

                  // 3. For today, check if business is already closed
                  if (isToday) {
                    const currentTime = `${new Date().toLocaleString("es-CR", { timeZone: "America/Costa_Rica", hour: '2-digit', minute: '2-digit', hour12: false })}`
                    const closingTime = daySchedule?.closeTime || "20:00"
                    if (currentTime >= closingTime) return true
                  }

                  return false
                }}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              className="mt-6 w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border-border/60 shadow-sm"
              onClick={() => { 
                if (staff.length === 1) {
                  setIsServiceStepDone(false)
                } else {
                  setSelectedBarber(null)
                }
                setSelectedDate(undefined)
                setAvailableSlots([]) 
              }}
            >
              Volver
            </Button>
          </section>
        )}

        {/* Step: Time Selection */}
        {currentStep === "time" && (
          <section className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="mb-2 text-xl font-black text-foreground tracking-tight">Elige el horario</h2>
            <div className="mb-8 flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 w-fit">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-xs font-black uppercase text-primary tracking-widest">
                {selectedDate?.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>

            {loadingSlots ? (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-3xl border border-dashed border-border/80">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
                <span className="mt-4 text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">Buscando espacios...</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={async () => {
                      setSelectedTime(time)
                      if (selectedBarber === "auto") {
                        setLoadingStaff(true)
                        try {
                          const dateStr = `${selectedDate!.getFullYear()}-${String(selectedDate!.getMonth() + 1).padStart(2, '0')}-${String(selectedDate!.getDate()).padStart(2, '0')}`
                          const availableStaff = await getAvailableStaffForSlot(shopId, dateStr, time, selectedServices)
                          if (availableStaff.length > 0) {
                            const randomStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)]
                            setAssignedAutoStaff(randomStaff)
                          } else {
                            // If auto-assignment fails due to conflict exactly now
                            setBookingError("Lo sentimos, este horario acaba de ser ocupado. Intenta otro.")
                            setSelectedTime(null)
                          }
                        } catch (e) {
                          console.error(e)
                        } finally {
                          setLoadingStaff(false)
                        }
                      } else {
                        setAssignedAutoStaff(null)
                      }
                    }}
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-base font-black transition-all cursor-pointer shadow-sm active:scale-90",
                      selectedTime === time
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10"
                        : "border-border bg-card text-card-foreground hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/80 bg-muted/5 p-12 text-center">
                <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                  <span className="text-2xl">🌙</span>
                </div>
                <p className="font-bold text-muted-foreground">No hay espacios disponibles</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Intenta con otra {t.appointment.toLowerCase() === 'turno' ? 'fecha' : 'fecha'}</p>
              </div>
            )}

            <Button
              variant="outline"
              className="mt-8 w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border-border/60 shadow-sm"
              onClick={() => { setSelectedDate(undefined); setSelectedTime(null); setAvailableSlots([]) }}
            >
              Volver
            </Button>
          </section>
        )}

        {/* Step: Customer Info */}
        {currentStep === "info" && (
          <section className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="mb-6 text-xl font-black text-foreground tracking-tight">Tus datos</h2>

            {initialClientName && (
              <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                  {initialClientName.charAt(0)}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-foreground">¡Hola, {initialClientName.split(' ')[0]}!</p>
                  <p className="text-muted-foreground font-medium">Hemos pre-completado tus datos.</p>
                </div>
              </div>
            )}

            {loadingStaff ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-border/80 bg-muted/5">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
                <span className="mt-4 text-sm font-bold text-muted-foreground/60 uppercase tracking-widest text-center">Asignando {t.staffGender === "f" ? "una" : "un"} {t.staff.toLowerCase()}...</span>
              </div>
            ) : (
              <>
                {/* Summary Card */}
                <div className="mb-8 rounded-3xl border border-border shadow-2xl shadow-black/5 bg-card overflow-hidden">
                  <div className="bg-primary/5 px-6 py-4 border-b border-primary/10">
                    <h3 className="text-[10px] uppercase font-black text-primary tracking-[0.2em]">Resumen de tu {t.appointment.toLowerCase()}</h3>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">{t.servicePlural}</p>
                      <div className="space-y-2">
                        {selectedServicesDetails.map(s => (
                          <div key={s.id} className="flex justify-between items-center group">
                            <span className="font-bold text-card-foreground">{s.name}</span>
                            <span className="font-black text-primary">{formatPrice(s.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/60">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Fecha</p>
                        <p className="font-bold text-card-foreground">
                          {selectedDate?.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Hora</p>
                        <p className="font-black text-primary text-xl tracking-tighter">{selectedTime}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">{t.staff}</p>
                        <p className="font-bold text-card-foreground">
                          {selectedBarber === "auto" ? assignedAutoStaff?.name : barber?.name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Duración</p>
                        <p className="font-bold text-card-foreground">{formatDuration(totalDuration)}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-5 border-t-2 border-dashed border-border/80 flex justify-between items-center">
                      <span className="font-black text-sm uppercase tracking-[0.1em] text-muted-foreground">Total a pagar</span>
                      <span className="text-3xl font-black text-primary tracking-tighter">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {isAdmin ? (
                    <Tabs value={clientType} onValueChange={(v: any) => {
                      setClientType(v);
                      if (v === 'unregistered') {
                        setSelectedClientId(null);
                        setClientName("");
                        setClientPhone("");
                      }
                    }}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="registered">{t.client} {t.clientGender === "f" ? "Registrada" : "Registrado"}</TabsTrigger>
                        <TabsTrigger value="unregistered">{t.client} {t.clientGender === "f" ? "Nueva" : "Nuevo"}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="registered" className="mt-4 space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={`Buscar ${t.client.toLowerCase()} por nombre o teléfono...`}
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="pl-9 bg-card"
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 border border-border rounded-xl p-2 bg-card">
                          {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone && c.phone.includes(clientSearch))).map(client => (
                            <button
                              key={client.id}
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setClientName(client.name);
                                setClientPhone(client.phone || "");
                              }}
                              className={cn(
                                "w-full text-left p-3 rounded-lg flex flex-col transition-colors cursor-pointer border",
                                selectedClientId === client.id ? "bg-primary/5 border-primary" : "hover:bg-muted/50 border-transparent bg-transparent"
                              )}
                            >
                              <span className="font-semibold text-sm text-foreground">{client.name}</span>
                              {client.phone && <span className="text-xs text-muted-foreground">{client.phone}</span>}
                            </button>
                          ))}
                          {clients.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">No hay {t.clientPlural.toLowerCase()}</div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="unregistered" className="mt-4 space-y-4">
                        <div className="space-y-1">
                          <Label htmlFor="name" className={touched.name && !clientName.trim() ? "text-sm text-destructive" : "text-sm text-foreground"}>Nombre completo *</Label>
                          <Input
                            id="name"
                            placeholder="Ej: Juan Pérez"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                            className={touched.name && !clientName.trim() ? "bg-card border-destructive focus-visible:ring-destructive" : "bg-card"}
                          />
                          {touched.name && !clientName.trim() && (
                            <p className="text-xs text-destructive">El nombre es requerido</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="phone" className={touched.phone && !clientPhone.trim() ? "text-sm text-destructive" : "text-sm text-foreground"}>Teléfono (WhatsApp) *</Label>
                          <Input
                            id="phone"
                            placeholder="+506 8888 8888"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                            className={touched.phone && !clientPhone.trim() ? "bg-card border-destructive focus-visible:ring-destructive" : "bg-card"}
                          />
                          {touched.phone && !clientPhone.trim() && (
                            <p className="text-xs text-destructive">El teléfono es requerido</p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="name" className={touched.name && !clientName.trim() ? "text-sm text-destructive" : "text-sm text-foreground"}>Nombre completo *</Label>
                        <Input
                          id="name"
                          placeholder="Ej: Juan Pérez"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                          className={touched.name && !clientName.trim() ? "bg-card border-destructive focus-visible:ring-destructive" : "bg-card"}
                        />
                        {touched.name && !clientName.trim() && (
                          <p className="text-xs text-destructive">El nombre es requerido</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phone" className={touched.phone && !clientPhone.trim() ? "text-sm text-destructive" : "text-sm text-foreground"}>Teléfono (WhatsApp){!isAdmin && " *"}</Label>
                        <Input
                          id="phone"
                          placeholder="+506 8888 8888"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                          className={touched.phone && !clientPhone.trim() && !isAdmin ? "bg-card border-destructive focus-visible:ring-destructive" : "bg-card"}
                        />
                        {touched.phone && !clientPhone.trim() && !isAdmin && (
                          <p className="text-xs text-destructive">El teléfono es requerido</p>
                        )}
                      </div>
                    </>
                  )}

                  {bookingError && (
                    <p className="text-sm text-destructive">{bookingError}</p>
                  )}

                  <Button
                    className="mt-4 h-14 w-full rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                    onClick={() => {
                      setTouched({ name: true, phone: true })
                      handleConfirm()
                    }}
                    disabled={(isAdmin && clientType === 'registered' && !selectedClientId) || !clientName || (!isAdmin && !clientPhone) || (isAdmin && clientType === 'unregistered' && !clientPhone) || isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t.bookingVerb}...
                      </>
                    ) : (
                      `Confirmar ${t.appointment}`
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border-border/60"
                    onClick={() => { setSelectedTime(null) }}
                  >
                    Volver
                  </Button>

                  {!initialClientName && !isAdmin && (
                    <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                      <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-foreground">¿Quieres guardar {t.appointmentGender === "f" ? "esta" : "este"} {t.appointment.toLowerCase()}?</p>
                        <p className="text-xs text-muted-foreground">Accede a tu cuenta para no volver a escribir tus datos.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="flex-1 h-10 rounded-lg text-xs gap-2 bg-background hover:bg-background/80"
                          onClick={() => handleAuthRedirect('login')}
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          Iniciar sesión
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1 h-10 rounded-lg text-xs gap-2 bg-background hover:bg-background/80"
                          onClick={() => handleAuthRedirect('register')}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Registrarse
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {/* Success Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-card border-border shadow-2xl rounded-[2.5rem] p-8 sm:p-12 overflow-hidden animate-in zoom-in duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          <DialogHeader className="items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-success/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-success/15 border border-success/20 shadow-inner">
                <CheckCircle2 className="h-12 w-12 text-success animate-bounce duration-1000" />
              </div>
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-black text-card-foreground tracking-tight">¡Todo listo!</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium text-lg">
                Tu cita ha sido agendada con éxito
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="mt-10 rounded-3xl bg-secondary/30 border border-border/60 p-6 space-y-4 shadow-inner">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Servicios</span>
              <span className="font-black text-foreground">{selectedServicesDetails.map(s => s.name).join(', ')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Fecha y Hora</span>
              <span className="font-black text-primary text-lg">
                {selectedDate?.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} @ {selectedTime}
              </span>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Button onClick={handleReset} className="h-14 w-full rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all">
              Listo, gracias
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
