"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { BookingFlow } from "@/components/booking/booking-flow"

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

interface ClientData {
  id: string
  name: string
  phone: string | null
}

interface AddAppointmentSheetProps {
  shopId: string
  shopName: string
  shopSlug: string
  whatsappPhone: string | null
  services: ServiceData[]
  staff: StaffData[]
  clients: ClientData[]
}

export function AddAppointmentSheet({
  shopId,
  shopName,
  shopSlug,
  whatsappPhone,
  services,
  staff,
  clients
}: AddAppointmentSheetProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Listen to custom successful booking event if we want to auto-close, 
  // or just let user close the sheet themselves. BookingFlow shows a Success Dialog anyway.

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto cursor-pointer shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Nueva Cita
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col gap-0 border-l border-border bg-background">
        <SheetHeader className="px-6 py-6 sm:px-10 pb-4 border-b border-border bg-card">
          <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
            Nueva Cita
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-base">
            Agenda una cita para un cliente registrado o uno nuevo.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            <BookingFlow
              shopId={shopId}
              shopName={shopName}
              shopSlug={shopSlug}
              whatsappPhone={whatsappPhone}
              services={services}
              staff={staff}
              clients={clients}
              isAdmin={true}
              hideHeader={true}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
