"use client"

import { Dispatch, SetStateAction, useState } from "react"

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
  categories?: string[]
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const allCategories = Array.from(new Set(services.flatMap(s => s.categories || []))).sort()
  const filteredServices = selectedCategory 
    ? services.filter(s => s.categories?.includes(selectedCategory))
    : services

  const firstSelectedService = services.find(s => selectedServices.includes(s.id))
  const activeCategory = firstSelectedService?.categories?.[0] || null

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-6 w-full min-w-0">
      <h2 className="mb-6 text-xl font-black text-foreground tracking-tight">Selecciona tus {t.servicePlural.toLowerCase()}</h2>
      
      {allCategories.length > 0 && (
        <div className="mb-6 flex overflow-x-auto pb-4 pt-2 px-2 -mx-2 gap-3 no-scrollbar snap-x">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "snap-start shrink-0 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
              selectedCategory === null
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Todas
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "snap-start shrink-0 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 w-full min-w-0">
        {filteredServices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground font-medium">No se encontraron {t.servicePlural.toLowerCase()} en esta categoría.</p>
          </div>
        )}
        {filteredServices.map((svc) => {
          const isSelected = selectedServices.includes(svc.id)
          const isBlocked = activeCategory && !isSelected && (!svc.categories || !svc.categories.includes(activeCategory))
          
          return (
            <button
              key={svc.id}
              onClick={() => {
                if (isBlocked) return
                setSelectedServices(prev =>
                  isSelected ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                )
              }}
              disabled={isBlocked as boolean}
              className={cn(
                "flex items-center gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all relative shadow-sm w-full min-w-0",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/5 cursor-pointer active:scale-[0.98]"
                  : isBlocked
                  ? "border-border/50 bg-muted/30 opacity-50 pointer-events-none"
                  : "border-border bg-card hover:border-primary/30 cursor-pointer active:scale-[0.98]"
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
                {isBlocked && (
                  <p className="text-[10px] text-muted-foreground mt-1 text-right max-w-[80px]">Categoría distinta</p>
                )}
              </div>
            </button>
          )
        })}
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
