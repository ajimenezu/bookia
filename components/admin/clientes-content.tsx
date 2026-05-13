import { ClientesInfiniteList } from "./clientes-infinite-list"
import prisma from "@/lib/prisma"
import { Role } from "@prisma/client"
import { getTerminology } from "@/lib/dictionaries"
import { calculateAppointmentPrice } from "@/lib/appointments"


// formatLastVisit removed (using lib/date-utils)


interface ClientesContentProps {
  shopId: string
  isSuperAdmin: boolean
  businessType: string
  q?: string
}

export async function ClientesContent({ shopId, isSuperAdmin, businessType, q }: ClientesContentProps) {
  const t = getTerminology(businessType as any)

  const whereClause = {
    AND: [
      { memberships: { some: { shopId, role: Role.CUSTOMER } } },
      q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q, mode: 'insensitive' } }] } : {}
    ]
  }

  const [dbUsers, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        memberships: true,
        appointmentsAsCustomer: {
          where: { shopId, status: "COMPLETED" },
          include: { 
            services: { select: { price: true } },
            service: { select: { price: true } }
          },
          orderBy: { startTime: "desc" }
        }
      },
      orderBy: { name: "asc" },
      take: 10
    }),
    prisma.user.count({ where: whereClause })
  ]) as [any[], number]


  const clients = dbUsers.map((user: any) => {
    const completedApps = user.appointmentsAsCustomer || []
    const totalVisits = completedApps.length
    
    const totalSpentValue = completedApps.reduce((acc: number, app: any) => {
      return acc + calculateAppointmentPrice(app)
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
  })
  // Sort is removed from initial load to match server action behavior (sorting by name)
  // or I can keep it if I want, but for pagination it's better to sort in the query.
  // I updated the query to sort by name.


  return (
    <>
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          {q ? `${totalCount} resultados encontrados` : `${totalCount} ${t.clientPlural.toLowerCase()} registrados`}
        </p>
      </div>

      <ClientesInfiniteList 
        initialClients={clients}
        shopId={shopId}
        businessType={businessType}
        q={q}
        terminology={t}
      />

    </>
  )
}
