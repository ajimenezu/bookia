"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { BookingFlow } from "@/components/booking/booking-flow"
import { BusinessType } from "@/lib/dictionaries"

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

interface AddAppointmentSheetProps {
  shopId: string
  shopName: string
  shopSlug: string
  businessType?: BusinessType
  whatsappPhone: string | null
  services: ServiceData[]
  staff: StaffData[]
  clients: ClientData[]
  shopSchedules?: {
    dayOfWeek: number
    closeTime: string
    isOpen: boolean
  }[]
}

export function AddAppointmentSheet({
  shopId,
  shopName,
  shopSlug,
  businessType,
  whatsappPhone,
  services,
  staff,
  clients,
  shopSchedules = []
}: AddAppointmentSheetProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto cursor-pointer shadow-md rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold h-9">
          <Plus className="mr-2 h-4 w-4" /> Nueva Cita
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col gap-0 border-l border-border bg-background h-full overflow-hidden">
        <SheetHeader className="px-4 py-6 sm:px-6 pb-4 border-b border-border bg-card">
          <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
            Nueva Cita
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-base">
            Agenda una cita para un cliente registrado o uno nuevo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide min-w-0 flex flex-col">
          <div className="py-0 w-full min-w-0 flex flex-col flex-1">
            <BookingFlow
              shopId={shopId}
              shopName={shopName}
              shopSlug={shopSlug}
              businessType={businessType}
              whatsappPhone={whatsappPhone}
              services={services}
              staff={staff}
              clients={clients}
              isAdmin={true}
              hideHeader={true}
              shopSchedules={shopSchedules}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
