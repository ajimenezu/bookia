"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ServiceForm } from "./service-form"
import { BusinessType, getTerminology } from "@/lib/dictionaries"

interface CreateServiceButtonProps {
  shopId: string
  slug: string
  businessType: BusinessType
}

export function CreateServiceButton({ shopId, slug, businessType }: CreateServiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = getTerminology(businessType)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto cursor-pointer shadow-sm">
        <Plus className="mr-2 h-4 w-4" /> {t.newService}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col gap-0 border-l border-border bg-background">
          <SheetHeader className="p-6 sm:p-10 pb-4">
            <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
              {t.newService}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-base">
              Define los detalles del nuevo {t.service.toLowerCase()} que ofrecerás a tus {t.clientPlural.toLowerCase()}.
            </SheetDescription>
          </SheetHeader>
          
          <div className="px-6 sm:px-10 pb-10 flex-1">
            <ServiceForm 
              slug={slug} 
              shopId={shopId}
              businessType={businessType}
              onSuccess={() => setIsOpen(false)} 
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
