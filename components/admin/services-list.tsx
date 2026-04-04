"use client"

import { useState } from "react"
import { ServiceCard } from "./service-card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ServiceForm } from "./service-form"
import { BusinessType } from "@/lib/dictionaries"
import { Button } from "@/components/ui/button"
import { Plus, Scissors } from "lucide-react"

interface ServicesListProps {
  services: any[]
  slug: string
  businessType: BusinessType
}

export function ServicesList({ services, slug, businessType }: ServicesListProps) {
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

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Servicios</h1>
          <p className="mt-1 text-muted-foreground">Gestiona los servicios de tu negocio</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto cursor-pointer shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center bg-card/10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <Scissors className="h-10 w-10" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-foreground">No hay servicios</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">Aún no has creado ningún servicio.</p>
          <Button onClick={handleCreate} className="mt-6 cursor-pointer shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Agregar primer servicio
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              {selectedService ? "Editar Servicio" : "Nuevo Servicio"}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-base">
              {selectedService 
                ? "Ajusta los detalles de este servicio. Los cambios se reflejarán instantáneamente." 
                : "Define los detalles del nuevo servicio que ofrecerás a tus clientes."
              }
            </SheetDescription>
          </SheetHeader>
          
          <div className="px-6 sm:px-10 pb-10 flex-1">
            <ServiceForm 
              slug={slug} 
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
