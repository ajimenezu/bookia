"use client"

import { useState, useTransition, useEffect, useCallback } from "react"

import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { fetchAvailableSlots, createBooking } from "@/app/schedule/actions"
import { BusinessType, getTerminology } from "@/lib/dictionaries"
import { getBusinessIcon } from "@/lib/business-icons"

// Step Components
import { ServiceStep } from "./steps/service-step"
import { StaffStep } from "./steps/staff-step"
import { DateStep } from "./steps/date-step"
import { TimeStep } from "./steps/time-step"
import { InfoStep } from "./steps/info-step"

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

  const stepNumber = { service: 1, barber: 2, date: 3, time: 4, info: 5 }

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
      createdAt: Date.now()
    }
    localStorage.setItem(`pending_booking_${shopId}`, JSON.stringify(state))
  }, [shopId, selectedServices, selectedBarber, selectedDate, selectedTime, currentStep, isServiceStepDone])

  const clearBookingState = useCallback(() => {
    localStorage.removeItem(`pending_booking_${shopId}`)
  }, [shopId])

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(`pending_booking_${shopId}`)
    if (saved) {
      try {
        const state = JSON.parse(saved)
        const expirationTime = 15 * 60 * 1000
        const isExpired = !state.createdAt || (Date.now() - state.createdAt > expirationTime)

        if (isExpired) {
          localStorage.removeItem(`pending_booking_${shopId}`)
          return
        }

        if (state.selectedServices) {
          const restored = state.selectedServices as string[]
          if (initialServiceId && !restored.includes(initialServiceId)) {
            setSelectedServices([...restored, initialServiceId])
          } else {
            setSelectedServices(restored)
          }
        }

        if (initialServiceId) {
          setIsServiceStepDone(false)
        } else if (state.isServiceStepDone) {
          setIsServiceStepDone(true)
        }

        if (state.selectedBarber) setSelectedBarber(state.selectedBarber)
        if (state.selectedDate) setSelectedDate(new Date(state.selectedDate))
        if (state.selectedTime) setSelectedTime(state.selectedTime)
      } catch (e) {
        console.error("Failed to restore booking state", e)
        localStorage.removeItem(`pending_booking_${shopId}`)
      }
    }
  }, [shopId])

  const handleAuthRedirect = (type: 'login' | 'register') => {
    saveBookingState()
    const path = type === 'login' ? 'login' : 'register'
    window.location.href = `/${shopSlug}/${path}`
  }

  // Formatting utils
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(price).replace("CRC", "₡")

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

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

      <main className={cn(
        "w-full min-w-0",
        isAdmin ? "py-6" : "mx-auto max-w-lg py-10"
      )}>
        {/* Shop name */}
        <div className={cn("text-center space-y-2 px-4 sm:px-6", isAdmin ? "mb-6" : "mb-10")}>
          <h1 className="text-3xl font-black text-foreground tracking-tight">{shopName}</h1>
          <p className="text-muted-foreground font-medium text-sm">Agenda tu {t.appointment.toLowerCase()} en segundos</p>
        </div>

        {/* Progress */}
        <div className={cn("flex items-center justify-center gap-3 px-4 sm:px-6", isAdmin ? "mb-8" : "mb-12")}>
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

        {/* Steps */}
        {currentStep === "service" && (
          <ServiceStep
            services={services}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            setIsServiceStepDone={setIsServiceStepDone}
            t={t}
            BusinessIcon={BusinessIcon}
            formatPrice={formatPrice}
            formatDuration={formatDuration}
            totalPrice={totalPrice}
            isAdmin={isAdmin}
            initialClientName={initialClientName}
            handleAuthRedirect={handleAuthRedirect}
            whatsappPhone={whatsappPhone}
          />
        )}

        {currentStep === "barber" && (
          <StaffStep
            allStaff={allStaff}
            selectedBarber={selectedBarber}
            setSelectedBarber={setSelectedBarber}
            setIsServiceStepDone={setIsServiceStepDone}
            t={t}
          />
        )}

        {currentStep === "date" && (
          <DateStep
            selectedDate={selectedDate}
            handleDateSelect={handleDateSelect}
            shopSchedules={shopSchedules}
            staff={staff}
            setIsServiceStepDone={setIsServiceStepDone}
            setSelectedBarber={setSelectedBarber}
            setSelectedDate={setSelectedDate}
            setAvailableSlots={setAvailableSlots}
          />
        )}

        {currentStep === "time" && (
          <TimeStep
            selectedDate={selectedDate}
            loadingSlots={loadingSlots}
            availableSlots={availableSlots}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            selectedBarber={selectedBarber}
            shopId={shopId}
            selectedServices={selectedServices}
            setAssignedAutoStaff={setAssignedAutoStaff}
            setLoadingStaff={setLoadingStaff}
            setBookingError={setBookingError}
            setSelectedDate={setSelectedDate}
            setAvailableSlots={setAvailableSlots}
            t={t}
          />
        )}

        {currentStep === "info" && (
          <InfoStep
            shopId={shopId}
            initialClientName={initialClientName}
            loadingStaff={loadingStaff}
            t={t}
            selectedServicesDetails={selectedServicesDetails}
            formatPrice={formatPrice}
            formatDuration={formatDuration}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedBarber={selectedBarber}
            assignedAutoStaff={assignedAutoStaff}
            barber={barber}
            totalDuration={totalDuration}
            totalPrice={totalPrice}
            isAdmin={isAdmin}
            clientType={clientType}
            setClientType={setClientType}
            setSelectedClientId={setSelectedClientId}
            setClientName={setClientName}
            setClientPhone={setClientPhone}
            clients={clients}
            clientSearch={clientSearch}
            setClientSearch={setClientSearch}
            selectedClientId={selectedClientId}
            clientName={clientName}
            clientPhone={clientPhone}
            touched={touched}
            setTouched={setTouched}
            bookingError={bookingError}
            handleConfirm={handleConfirm}
            setSelectedTime={setSelectedTime}
            isPending={isPending}
            handleAuthRedirect={handleAuthRedirect}
          />
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

