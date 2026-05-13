import { ClientesInfiniteList } from "./clientes-infinite-list"
import prisma from "@/lib/prisma"
import { Role, Prisma } from "@prisma/client"
import { getTerminology, BusinessType } from "@/lib/dictionaries"
import { calculateAppointmentPrice } from "@/lib/appointments"
import { formatLastVisit } from "@/lib/date-utils"

interface ClientesContentProps {
  shopId: string
  isSuperAdmin: boolean
  businessType: BusinessType
  q?: string
}

export async function ClientesContent({ shopId, isSuperAdmin, businessType, q }: ClientesContentProps) {
  const t = getTerminology(businessType)

  const whereClause: Prisma.UserWhereInput = {
    memberships: { 
      some: { 
        shopId, 
        role: Role.CUSTOMER 
      } 
    },
    ...(q ? { 
      OR: [
        { name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }, 
        { email: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }, 
        { phone: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }
      ] 
    } : {})
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
  ])


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
