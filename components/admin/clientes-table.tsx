"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ClientDetailSheet } from "./client-detail-sheet"

interface ClientesTableProps {
  clients: any[]
  shopId: string
  businessType: string
  terminology: any
}

export function ClientesTable({ clients, shopId, businessType, terminology }: ClientesTableProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleRowClick = (clientId: string) => {
    setSelectedClientId(clientId)
    setIsSheetOpen(true)
  }

  const t = terminology

  return (
    <>
      <div className="hidden rounded-xl border border-border bg-card md:block overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">{t.client}</th>
                <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Teléfono</th>
                <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Visitas completadas</th>
                <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Total gastado</th>
                <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Última visita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client: any) => (
                <tr 
                  key={client.id} 
                  className="transition-all hover:bg-primary/[0.03] cursor-pointer group"
                  onClick={() => handleRowClick(client.id)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-xs font-black text-secondary-foreground border border-border/50 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary/20 transition-all duration-300">
                        {client.name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("")}
                      </div>
                      <span className="font-bold text-card-foreground group-hover:text-primary transition-colors">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-muted-foreground">{client.phone}</td>
                  <td className="px-5 py-4 text-center">
                    <Badge variant="secondary" className="font-black px-2 py-0.5 text-[10px] rounded-lg">
                      {client.visits}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right font-black text-primary text-sm">{client.totalSpent}</td>
                  <td className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">{client.lastVisit}</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-20 text-center text-muted-foreground font-medium italic">
                    No se encontraron {t.clientPlural.toLowerCase()} registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
