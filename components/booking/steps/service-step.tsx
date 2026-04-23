"use client"

import { Dispatch, SetStateAction } from "react"

import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LogIn, UserPlus } from "lucide-react"

interface ServiceData {
  id: string
  name: string
  price: number
  duration: number
  description: string | null
}

interface ServiceStepProps {
  services: ServiceData[]
  selectedServices: string[]
  setSelectedServices: Dispatch<SetStateAction<string[]>>
  setIsServiceStepDone: Dispatch<SetStateAction<boolean>>
  t: any
  BusinessIcon: any
  formatPrice: (price: number) => string
  formatDuration: (minutes: number) => string
  totalPrice: number
  isAdmin: boolean
  initialClientName?: string
  handleAuthRedirect: (type: 'login' | 'register') => void
  whatsappPhone: string | null
}

export function ServiceStep({
  services,
  selectedServices,
  setSelectedServices,
  setIsServiceStepDone,
  t,
  BusinessIcon,
  formatPrice,
  formatDuration,
  totalPrice,
  isAdmin,
  initialClientName,
  handleAuthRedirect,
  whatsappPhone
}: ServiceStepProps) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-6 w-full min-w-0">
      <h2 className="mb-6 text-xl font-black text-foreground tracking-tight">Selecciona tus {t.servicePlural.toLowerCase()}</h2>
      <div className="flex flex-col gap-4 w-full min-w-0">
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
                "flex items-center gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all cursor-pointer relative shadow-sm active:scale-[0.98] w-full min-w-0",
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
                  <span className="inline-flex items-center justify-center text-xs font-medium bg-muted px-2 py-0.5 rounded-md w-[72px]">{formatDuration(svc.duration)}</span>
                </div>

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

      <div className="sticky bottom-0 z-20 mt-auto">
        <div className="h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        <div className="bg-background border-t border-border/40 px-4 sm:px-6 pb-6 pt-2 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]">
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
            {(isAdmin || initialClientName) ? "Continuar" : "Continuar sin cuenta"}
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
  )
}
