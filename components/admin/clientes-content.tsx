import { ClientesTable } from "./clientes-table"
import { ClientesListMobile } from "./clientes-list-mobile"
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
        where: { shopId, status: "COMPLETED" }, // Always scoped to shopId
        include: { 
          services: { select: { price: true } },
          service: { select: { price: true } }
        },
        orderBy: { startTime: "desc" }
      }
    }
  }) as any[]

  const clients = dbUsers.map((user: any) => {
    const completedApps = user.appointmentsAsCustomer || []
    const totalVisits = completedApps.length
    
    const totalSpentValue = completedApps.reduce((acc: number, app: any) => {
      const price = app.priceAtBooking ?? app.services?.reduce((sAcc: number, s: any) => sAcc + (s.price || 0), 0) ?? app.service?.price ?? 0
      return acc + price
    }, 0)

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
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          {q ? `${clients.length} resultados encontrados` : `${clients.length} ${t.clientPlural.toLowerCase()} registrados`}
        </p>
      </div>

      <ClientesTable 
        clients={clients} 
        shopId={shopId} 
        businessType={businessType} 
        terminology={t} 
      />

      <ClientesListMobile 
        clients={clients} 
        shopId={shopId} 
        businessType={businessType} 
        terminology={t} 
      />
    </>
  )
}
