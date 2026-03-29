import { Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { formatDistanceToNow, isToday, isYesterday, differenceInDays } from "date-fns"
import { ClientSearch } from "@/components/admin/client-search"
import { CreateUserModal } from "@/components/admin/create-user-modal"
import { Role } from "@prisma/client"
import { getTerminology } from "@/lib/dictionaries"
import { notFound } from "next/navigation"

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

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function ClientesPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) notFound()

  const { shopId, isSuperAdmin, user: currentUser, businessType } = await requireAdmin(shop.id)
  const t = getTerminology(businessType)
  const currentUserId = currentUser.id
  const { q } = await searchParams

  const dbUsers = await prisma.user.findMany({
    where: {
      AND: [
        isSuperAdmin ? {} : { OR: [{ memberships: { some: { shopId } } }, { appointmentsAsCustomer: { some: { shopId } } }] },
        q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q, mode: 'insensitive' } }] } : {}
      ]
    },
    include: {
      appointmentsAsCustomer: {
        where: isSuperAdmin ? { status: "COMPLETED" } : { shopId, status: "COMPLETED" },
        include: { service: true },
        orderBy: { startTime: "desc" }
      }
    }
  })

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
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Clientes</h1>
          <p className="mt-1 text-muted-foreground">{q ? `${clients.length} resultados encontrados` : `${clients.length} clientes registrados`}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ClientSearch placeholder="Buscar por nombre, email o teléfono..." />
          <CreateUserModal currentUserRole={dbUsers.find(u => u.id === currentUserId)?.role || Role.CUSTOMER} isSuperAdmin={isSuperAdmin} shopId={shopId} />
        </div>
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
      <div className="grid gap-3 md:hidden">
        {clients.map((client: any) => (
          <div key={client.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {client.name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("")}
              </div>
              <div className="flex-1">
                <p className="font-medium text-card-foreground">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">{client.visits} visitas</span>
              <span className="font-medium text-primary">{client.totalSpent}</span>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No se encontraron {t.clientPlural.toLowerCase()} registrados.</div>
        )}
      </div>
    </div>
  )
}
