import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getTerminology } from "@/lib/dictionaries"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { StaffScheduleDialog } from "./staff-schedule-dialog"

interface StaffContentProps {
  shopId: string
  role: string
  isSuperAdmin: boolean
  businessType: string
}

interface StaffStats {
  name: string
  initials: string
  specialty: string
  status: string
  rating: number
  todayAppointments: number
  weekAppointments: number
}

export async function StaffContent({ shopId, role, isSuperAdmin, businessType }: StaffContentProps) {

  let whereClause: any = {
    role: { in: ["OWNER", "STAFF"] }
  }
  
  if (isSuperAdmin && shopId === "ALL") {
    // No additional filters needed, keeps just the role filter.
  } else {
    whereClause.shopId = shopId
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const diffToMonday = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diffToMonday)
  weekStart.setHours(0, 0, 0, 0)
  const earliestDate = weekStart

  const rawMembers = await prisma.shopMember.findMany({
    where: whereClause,
    include: {
      user: {
        include: {
          appointmentsAsStaff: {
            where: {
              status: "COMPLETED",
              startTime: { gte: earliestDate }
            }
          },
          staffSchedules: {
            where: { shopId },
            include: {
              breaks: true
            }
          },
          staffTimeOff: {
            where: { shopId }
          }
        }
      }
    },
    orderBy: {
      role: 'asc'
    }
  })


  const isOwner = role === "OWNER" || isSuperAdmin
  const t = getTerminology(businessType as any)

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {rawMembers.map((member) => {
        const user = member.user
        const name = user.name || user.email.split("@")[0]
        const initials = name
          .split(" ")
          .slice(0, 2)
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
        const appointments = user.appointmentsAsStaff || []
        let todayAppointments = 0,
          weekAppointments = 0

        for (const appt of appointments) {
          const time = appt.startTime.getTime()
          if (time >= todayStart.getTime()) todayAppointments++
          if (time >= weekStart.getTime()) weekAppointments++
        }

        let specialty = "Cliente"
        if (member.role === "OWNER") specialty = "Propietario / Gerente"
        else if (member.role === "STAFF") specialty = "Personal"
        else if (member.role === "SUPER_ADMIN") specialty = "Administrador"

        return (
          <StaffMemberCard
            key={member.id}
            shopId={shopId}
            staffId={user.id}
            isOwner={isOwner}
            schedules={user.staffSchedules}
            timeOff={user.staffTimeOff}
            terminology={t}
            stats={{
              name,
              initials,
              specialty,
              status: "Activo",
              rating: 5.0,
              todayAppointments,
              weekAppointments,
            }}
          />
        )
      })}
      {rawMembers.length === 0 && (
        <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
          No se encontraron {t.staffPlural.toLowerCase()}.
        </div>
      )}
    </div>
  )
}

function StaffMemberCard({
  shopId,
  staffId,
  isOwner,
  schedules,
  timeOff,
  stats,
  terminology: t,
}: {
  shopId: string
  staffId: string
  isOwner: boolean
  schedules: any[]
  timeOff: any[]
  stats: StaffStats
  terminology: any
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary border border-primary/20 shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
              {stats.initials}
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-card shadow-sm" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-card-foreground tracking-tight group-hover:text-primary transition-colors">
              {stats.name}
            </h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stats.specialty}</p>
          </div>
        </div>
        <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20 h-fit rounded-lg px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider">
          {stats.status}
        </Badge>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between text-sm bg-muted/5 p-3 rounded-xl border border-border/40">
          <span className="flex items-center gap-2.5 text-muted-foreground font-medium">
            <Star className="h-4 w-4 text-primary fill-primary" /> Calificación
          </span>
          <span className="font-black text-card-foreground">
            {stats.rating.toFixed(1)} <span className="text-[10px] text-muted-foreground/60">/ 5.0</span>
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 text-sm bg-muted/5 p-3 rounded-xl border border-border/40">
            <span className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-wider">{t.appointmentPlural} hoy</span>
            <span className="font-black text-lg text-card-foreground">{stats.todayAppointments}</span>
          </div>
          <div className="flex flex-col gap-1 text-sm bg-muted/5 p-3 rounded-xl border border-border/40">
            <span className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-wider">{t.appointmentPlural} semana</span>
            <span className="font-black text-lg text-card-foreground">{stats.weekAppointments}</span>
          </div>
        </div>

      </div>

      <div className="mt-6 pt-5 border-t border-border/60">
        <StaffScheduleDialog
          shopId={shopId}
          staffId={staffId}
          staffName={stats.name}
          initialSchedules={schedules}
          initialTimeOff={timeOff}
          isOwner={isOwner}
        />
      </div>
    </div>
  )
}
