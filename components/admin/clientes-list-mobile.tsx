"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ClientDetailSheet } from "./client-detail-sheet"

interface ClientesListMobileProps {
  clients: any[]
  shopId: string
  businessType: string
  terminology: any
}

export function ClientesListMobile({ clients, shopId, businessType, terminology }: ClientesListMobileProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleCardClick = (clientId: string) => {
    setSelectedClientId(clientId)
    setIsSheetOpen(true)
  }

  const t = terminology

  return (
    <>
      <div className="grid gap-4 md:hidden">
        {clients.map((client: any) => (
          <div 
            key={client.id} 
            className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.98] cursor-pointer group"
            onClick={() => handleCardClick(client.id)}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-black text-secondary-foreground border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary/20 transition-all duration-300">
                {client.name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-card-foreground text-lg leading-tight truncate group-hover:text-primary transition-colors">
                  {client.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 h-4 font-black border-primary/20 text-primary uppercase rounded-md">
                    {client.visits} Visitas
                  </Badge>
                  <p className="text-xs font-bold text-muted-foreground truncate">{client.phone}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-border/40">
              <div className="bg-muted/10 p-3 rounded-2xl border border-border/40">
                <p className="text-[10px] uppercase font-black text-muted-foreground/60 mb-1 tracking-widest">Invertido</p>
                <p className="font-black text-primary text-base">{client.totalSpent}</p>
              </div>
              <div className="bg-muted/10 p-3 rounded-2xl border border-border/40">
                <p className="text-[10px] uppercase font-black text-muted-foreground/60 mb-1 tracking-widest">Última</p>
                <p className="font-black text-foreground/80 text-base">{client.lastVisit}</p>
              </div>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="rounded-[2rem] border border-border border-dashed bg-muted/5 p-12 text-center">
            <div className="mx-auto h-16 w-16 mb-4 rounded-3xl bg-muted/20 flex items-center justify-center grayscale opacity-50">
              <span className="text-2xl">👤</span>
            </div>
            <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">No hay registros</p>
            <p className="text-xs font-medium text-muted-foreground/60 mt-1">
              Los {t.clientPlural.toLowerCase()} aparecerán aquí.
            </p>
          </div>
        )}
      </div>

      <ClientDetailSheet 
        clientId={selectedClientId}
        shopId={shopId}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        businessType={businessType}
      />
    </>
  )
}
