import { Badge } from "@/components/ui/badge"
import prisma from "@/lib/prisma"
import { isToday, isYesterday, differenceInDays } from "date-fns"
import { Role } from "@prisma/client"
import { getTerminology } from "@/lib/dictionaries"

function formatLastVisit(date: Date) {
  if (isToday(date)) return "Hoy"
  if (isYesterday(date)) return "Ayer"
  const days = differenceInDays(new Date(), date)
  if (days < 7) return `Hace ${days} días`
  if (days < 30) { const weeks = Math.floor(days / 7); return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}` }
  if (days < 365) { const months = Math.floor(days / 30); return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}` }
  const years = Math.floor(days / 365)
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`
}

interface ClientesContentProps {
  shopId: string
  isSuperAdmin: boolean
  businessType: string
  q?: string
}

export async function ClientesContent({ shopId, isSuperAdmin, businessType, q }: ClientesContentProps) {
  const t = getTerminology(businessType as any)

  const dbUsers = await prisma.user.findMany({
    where: {
      AND: [
        { memberships: { some: { shopId, role: Role.CUSTOMER } } },
        q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q, mode: 'insensitive' } }] } : {}
      ]
    },
    include: {
      memberships: true,
      appointmentsAsCustomer: {
        where: isSuperAdmin ? { status: "COMPLETED" } : { shopId, status: "COMPLETED" },
        include: { service: true },
        orderBy: { startTime: "desc" }
      }
    }
  }) as any[]

  const clients = dbUsers.map((user: any) => {
    const completedApps = user.appointmentsAsCustomer || []
    const totalVisits = completedApps.length
    const totalSpentValue = completedApps.reduce((acc: number, app: any) => acc + (app.priceAtBooking ?? app.service?.price ?? 0), 0)
    const lastVisitDate = completedApps[0]?.startTime
    return {
      id: user.id,
      name: user.name || user.email || "Cliente sin nombre",
      phone: user.phone || "Sin teléfono",
      visits: totalVisits,
      totalSpent: new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(totalSpentValue).replace("CRC", "₡"),
      lastVisit: lastVisitDate ? formatLastVisit(new Date(lastVisitDate)) : "Sin visitas"
    }
  }).sort((a: any, b: any) => b.visits - a.visits)

  return (
    <>
      <div className="mb-4">
        <p className="text-muted-foreground">{q ? `${clients.length} resultados encontrados` : `${clients.length} clientes registrados`}</p>
      </div>

      <div className="hidden rounded-xl border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.client}</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Teléfono</th>
                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Visitas</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total gastado</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Última visita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client: any) => (
                <tr key={client.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {client.name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("")}
                      </div>
                      <span className="font-medium text-card-foreground">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{client.phone}</td>
                  <td className="px-5 py-4 text-center"><Badge variant="secondary">{client.visits}</Badge></td>
                  <td className="px-5 py-4 text-right font-medium text-primary">{client.totalSpent}</td>
                  <td className="px-5 py-4 text-right text-sm text-muted-foreground">{client.lastVisit}</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No se encontraron {t.clientPlural.toLowerCase()} registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {clients.map((client: any) => (
          <div key={client.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-bold text-secondary-foreground border border-border animate-in zoom-in duration-300">
                {client.name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-card-foreground text-lg leading-tight truncate">{client.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 h-4 font-bold border-primary/20 text-primary uppercase">
                    {client.visits} Visitas
                  </Badge>
                  <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-border/60">
              <div className="bg-muted/10 p-3 rounded-xl border border-border/40">
                <p className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-wider">Total Invertido</p>
                <p className="font-black text-primary text-base">{client.totalSpent}</p>
              </div>
              <div className="bg-muted/10 p-3 rounded-xl border border-border/40">
                <p className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-wider">Última Visita</p>
                <p className="font-black text-foreground/80 text-base">{client.lastVisit}</p>
              </div>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="rounded-2xl border border-border border-dashed bg-muted/5 p-12 text-center">
            <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-muted/20 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <p className="font-bold text-muted-foreground">No hay {t.clientPlural.toLowerCase()} registrados.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Cuando alguien reserve, aparecerá aquí.</p>
          </div>
        )}
      </div>
    </>
  )
}
