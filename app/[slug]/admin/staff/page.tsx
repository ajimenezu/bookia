import { Star, Calendar, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { requireAdmin } from "@/lib/auth-utils"
import { getTerminology } from "@/lib/dictionaries"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
}

interface StaffStats {
  name: string; initials: string; specialty: string; status: string
  rating: number; todayAppointments: number; weekAppointments: number; monthRevenue: string
}

export default async function StaffPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) notFound()

  const { role, shopId, isSuperAdmin, businessType } = await requireAdmin(shop.id)
  const t = getTerminology(businessType)

  let whereClause: Prisma.ShopMemberWhereInput = {}
  if (isSuperAdmin) { whereClause = shopId === "ALL" ? {} : { shopId } }
  else if (role === "OWNER") { whereClause = { shopId, role: { in: ["OWNER", "STAFF"] } } }
  else if (role === "STAFF") { whereClause = { shopId, role: "STAFF" } }
  else { whereClause = { shopId, id: "NONE" } }

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const diffToMonday = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() + diffToMonday); weekStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const earliestDate = new Date(Math.min(weekStart.getTime(), monthStart.getTime()))

  const rawMembers = await prisma.shopMember.findMany({
    where: whereClause,
    include: {
      user: {
        include: {
          appointmentsAsStaff: {
            where: { status: "COMPLETED", startTime: { gte: earliestDate } }
          }
        }
      }
    }
  })

  const formatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.staffPlural}</h1>
        <p className="mt-1 text-muted-foreground">Equipo de tu negocio</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rawMembers.map((member) => {
          const user = member.user
          const name = user.name || user.email.split('@')[0]
          const initials = name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
          const appointments = user.appointmentsAsStaff || []
          let todayAppointments = 0, weekAppointments = 0, monthRevenueValue = 0

          for (const appt of appointments) {
            const time = appt.startTime.getTime()
            if (time >= todayStart.getTime()) todayAppointments++
            if (time >= weekStart.getTime()) weekAppointments++
            if (time >= monthStart.getTime()) monthRevenueValue += ((appt as any).priceAtBooking || 0)
          }

          const monthRevenue = formatter.format(monthRevenueValue)
          let specialty = "Cliente"
          if (member.role === "OWNER") specialty = "Propietario / Gerente"
          else if (member.role === "STAFF") specialty = "Personal"
          else if (member.role === "SUPER_ADMIN") specialty = "Administrador"

          return (
            <StaffMemberCard key={member.id} stats={{ name, initials, specialty, status: "Activo", rating: 5.0, todayAppointments, weekAppointments, monthRevenue }} />
          )
        })}
        {rawMembers.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
            No se encontraron miembros del equipo.
          </div>
        )}
      </div>
    </div>
  )
}

function StaffMemberCard({ stats }: { stats: StaffStats }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {stats.initials}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">{stats.name}</h3>
          <p className="text-sm text-muted-foreground">{stats.specialty}</p>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground"><Star className="h-3.5 w-3.5 text-primary" /> Calificación</span>
          <span className="font-semibold text-card-foreground">{stats.rating.toFixed(1)}/5.0</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Citas hoy</span>
          <Badge variant="secondary">{stats.todayAppointments}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Citas esta semana</span>
          <Badge variant="secondary">{stats.weekAppointments}</Badge>
        </div>
        <div className="mt-2 border-t border-border pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> Ingreso del mes</span>
            <span className="text-lg font-bold text-primary">{stats.monthRevenue}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Badge className="bg-success/15 text-success border-success/30">{stats.status}</Badge>
      </div>
    </div>
  )
}
