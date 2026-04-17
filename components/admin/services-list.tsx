"use client"

import { useState } from "react"
import { ServiceCard } from "./service-card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ServiceForm } from "./service-form"
import { BusinessType } from "@/lib/dictionaries"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getBusinessIcon } from "@/lib/business-icons"
import { getTerminology } from "@/lib/dictionaries"

interface ServicesListProps {
  services: any[]
  slug: string
  shopId: string
  businessType: BusinessType
}

export function ServicesList({ services, slug, shopId, businessType }: ServicesListProps) {
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleEdit = (service: any) => {
    setSelectedService(service)
    setIsOpen(true)
  }

  const handleCreate = () => {
    setSelectedService(null)
    setIsOpen(true)
  }

  const handleSuccess = () => {
    setIsOpen(false)
    setSelectedService(null)
  }

  const t = getTerminology(businessType)
  const EmptyIcon = getBusinessIcon(businessType)

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={handleCreate} className="w-full sm:w-auto cursor-pointer shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> {t.newService}
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center bg-card/10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <EmptyIcon className="h-10 w-10" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-foreground">No hay {t.servicePlural.toLowerCase()}</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">Aún no has creado ningún {t.service.toLowerCase()}.</p>
          <Button onClick={handleCreate} className="mt-6 cursor-pointer shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Agregar primer {t.service.toLowerCase()}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard 
              key={service.id} 
              name={service.name} 
              price={service.price} 
              duration={service.duration} 
              description={service.description}
              businessType={businessType}
              onClick={() => handleEdit(service)}
            />
          ))}
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col gap-0 border-l border-border bg-background">
          <SheetHeader className="p-6 sm:p-10 pb-4">
            <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
              {selectedService ? `Editar ${t.service}` : t.newService}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-base">
              {selectedService 
                ? `Ajusta los detalles de este ${t.service.toLowerCase()}. Los cambios se reflejarán instantáneamente.` 
                : `Define los detalles del nuevo ${t.service.toLowerCase()} que ofrecerás a tus ${t.clientPlural.toLowerCase()}.`
              }
            </SheetDescription>
          </SheetHeader>
          
          <div className="px-6 sm:px-10 pb-10 flex-1">
            <ServiceForm 
              slug={slug} 
              shopId={shopId}
              businessType={businessType}
              initialData={selectedService} 
              onSuccess={handleSuccess} 
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
