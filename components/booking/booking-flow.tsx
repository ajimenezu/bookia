"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { Scissors, UserCheck, CalendarDays, CheckCircle2, Loader2, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { es } from "date-fns/locale"
import { fetchAvailableSlots, createBooking, getAvailableStaffForSlot } from "@/app/schedule/actions"

interface ServiceData {
  id: string
  name: string
  price: number
  duration: number
}

interface StaffData {
  id: string
  name: string
}

interface BookingFlowProps {
  shopId: string
  shopName: string
  shopSlug: string
  whatsappPhone: string | null
  services: ServiceData[]
  staff: StaffData[]
  initialClientName?: string
  initialClientPhone?: string
  hideHeader?: boolean
}

type Step = "service" | "barber" | "date" | "time" | "info"
export function BookingFlow({ 
  shopId, 
  shopName, 
  shopSlug,
  whatsappPhone, 
  services, 
  staff,
  initialClientName,
  initialClientPhone,
  hideHeader = false
}: BookingFlowProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isServiceStepDone, setIsServiceStepDone] = useState(false)
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState(initialClientName || "")
  const [clientPhone, setClientPhone] = useState(initialClientPhone || "")
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
        if (state.selectedServices) setSelectedServices(state.selectedServices)
        if (state.isServiceStepDone) setIsServiceStepDone(true)
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
    setSelectedBarber(null)
    setSelectedDate(undefined)
    setSelectedTime(null)
    setClientName(initialClientName || "")
    setClientPhone(initialClientPhone || "")
    setShowConfirmation(false)
    setBookingError(null)
    setAvailableSlots([])
    setAssignedAutoStaff(null)
    clearBookingState()
  }

  // Add "auto" option to staff list
  const allStaff = [
    { id: "auto", name: "Asignación automática" },
    ...staff,
  ]

  const selectedServicesDetails = services.filter((s) => selectedServices.includes(s.id))
  const totalPrice = selectedServicesDetails.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServicesDetails.reduce((sum, s) => sum + s.duration, 0)
  const barber = allStaff.find((b) => b.id === selectedBarber)

  return (
    <div className={cn(!hideHeader && "min-h-screen bg-background")}>
      {!hideHeader && (
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Scissors className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-foreground">BookIA</span>
            </Link>

            {initialClientName && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                  {initialClientName.split(' ')[0]}
                </span>
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {initialClientName.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      <main className="mx-auto max-w-lg px-4 py-8">
        {/* Shop name */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">{shopName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reserva tu cita en segundos</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={cn(
                "h-1.5 w-10 rounded-full transition-colors",
                step <= stepNumber[currentStep]
                  ? "bg-primary"
                  : "bg-secondary"
              )}
            />
          ))}
        </div>

        {/* Step: Service Selection */}
        {currentStep === "service" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Elige tus servicios</h2>
            <div className="grid gap-3">
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
                      "flex items-center gap-4 rounded-xl border p-4 text-left transition-colors cursor-pointer relative",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    )}>
                      {isSelected ? <CheckCircle2 className="h-6 w-6" /> : <Scissors className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground">{svc.name}</p>
                      <p className="text-sm text-muted-foreground">{formatDuration(svc.duration)}</p>
                    </div>
                    <span className="text-lg font-semibold text-primary">{formatPrice(svc.price)}</span>
                  </button>
                )
              })}
              {services.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">No hay servicios disponibles</p>
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

            <div className="mt-6 border-t border-border pt-4 sticky bottom-0 bg-background/95 backdrop-blur z-10 pb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{selectedServices.length} {selectedServices.length === 1 ? 'servicio' : 'servicios'}</span>
                <span className="font-bold text-lg text-primary">{totalPrice > 0 ? formatPrice(totalPrice) : ''}</span>
              </div>
              <Button
                className="w-full h-12 rounded-xl text-base font-semibold"
                onClick={() => setIsServiceStepDone(true)}
                disabled={selectedServices.length === 0}
              >
                Continuar sin cuenta
              </Button>
              
              {!initialClientName && (
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">o para guardar tus citas</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl text-xs gap-2"
                      onClick={() => handleAuthRedirect('login')}
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Iniciar sesión
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl text-xs gap-2"
                      onClick={() => handleAuthRedirect('register')}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Registrarse
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Step: Staff Selection */}
        {currentStep === "barber" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Elige un profesional</h2>
            <div className="grid gap-3">
              {allStaff.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBarber(b.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 text-left transition-colors cursor-pointer",
                    selectedBarber === b.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  {b.id === "auto" ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCheck className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                      {b.name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("")}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-card-foreground">{b.name}</p>
                    {b.id === "auto" && (
                      <p className="text-sm text-muted-foreground">Primer profesional disponible</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full h-12 rounded-xl"
              onClick={() => { setIsServiceStepDone(false); setSelectedBarber(null) }}
            >
              Volver
            </Button>
          </section>
        )}

        {/* Step: Date Selection */}
        {currentStep === "date" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Elige una fecha</h2>
            <div className="flex justify-center rounded-xl border border-border bg-card p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={es}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => { setSelectedBarber(null); setSelectedDate(undefined); setAvailableSlots([]) }}
            >
              Volver
            </Button>
          </section>
        )}

        {/* Step: Time Selection */}
        {currentStep === "time" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Elige un horario</h2>
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>{selectedDate?.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</span>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Cargando horarios...</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
                      "rounded-xl border px-3 py-3 text-sm font-medium transition-colors cursor-pointer",
                      selectedTime === time
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-card-foreground hover:border-primary/40"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                No hay horarios disponibles para esta fecha
              </div>
            )}

            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => { setSelectedDate(undefined); setSelectedTime(null); setAvailableSlots([]) }}
            >
              Volver
            </Button>
          </section>
        )}

        {/* Step: Customer Info */}
        {currentStep === "info" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Tus datos</h2>
            
            {initialClientName && (
              <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {initialClientName.charAt(0)}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">¡Hola, {initialClientName.split(' ')[0]}!</p>
                  <p className="text-muted-foreground text-xs">Hemos pre-completado tus datos.</p>
                </div>
              </div>
            )}

            {loadingStaff ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border bg-card">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="mt-4 text-sm text-muted-foreground">Asignando un profesional...</span>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="mb-6 rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Resumen de tu cita</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Servicios</span>
                      <div className="pl-2 border-l-2 border-primary/20">
                        {selectedServicesDetails.map(s => (
                          <div key={s.id} className="flex justify-between font-medium text-card-foreground">
                            <span>{s.name}</span>
                            <span>{formatPrice(s.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-muted-foreground">Profesional</span>
                      <span className="font-medium text-card-foreground">
                        {selectedBarber === "auto" ? assignedAutoStaff?.name : barber?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha</span>
                      <span className="font-medium text-card-foreground">
                        {selectedDate?.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hora</span>
                      <span className="font-medium text-primary">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duración Total</span>
                      <span className="font-medium text-card-foreground">{formatDuration(totalDuration)}</span>
                    </div>
                    <div className="mt-1 border-t border-border pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="text-lg font-bold text-primary">{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name" className="mb-1.5 text-sm text-foreground">Nombre completo</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Juan Pérez"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="bg-card"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="mb-1.5 text-sm text-foreground">Teléfono (WhatsApp)</Label>
                    <Input
                      id="phone"
                      placeholder="+506 8888 8888"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="bg-card"
                    />
                  </div>

                  {bookingError && (
                    <p className="text-sm text-destructive">{bookingError}</p>
                  )}

                  <Button
                    className="mt-2 h-12 w-full rounded-xl text-base font-semibold"
                    onClick={handleConfirm}
                    disabled={!clientName || !clientPhone || isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reservando...
                      </>
                    ) : (
                      "Confirmar Reserva"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setSelectedTime(null) }}
                  >
                    Volver
                  </Button>

                  {!initialClientName && (
                    <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                      <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-foreground">¿Quieres guardar esta cita?</p>
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
        <DialogContent className="bg-card text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-xl text-card-foreground">Reserva confirmada</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tu cita ha sido agendada exitosamente
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-secondary/50 p-4 text-left text-sm">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium text-card-foreground">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicios</span>
                <span className="font-medium text-card-foreground text-right">{selectedServicesDetails.map(s => s.name).join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profesional</span>
                <span className="font-medium text-card-foreground">
                  {selectedBarber === "auto" ? assignedAutoStaff?.name : barber?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-medium text-card-foreground">
                  {selectedDate?.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hora</span>
                <span className="font-bold text-primary">{selectedTime}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Recibirás un recordatorio por WhatsApp al{" "}
            <span className="font-medium text-card-foreground">{clientPhone}</span>
          </p>
          <Button onClick={handleReset} className="mt-2 w-full rounded-xl">
            Nueva Reserva
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
