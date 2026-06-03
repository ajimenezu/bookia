import { getTerminology } from "@/lib/dictionaries"
import prisma from "@/lib/prisma"
import { Role, AppointmentStatus } from "@prisma/client"
import { StaffMemberCard } from "./staff-member-card"

interface StaffContentProps {
  shopId: string
  role: string
  currentUserId: string
  isSuperAdmin: boolean
  businessType: string
}

export async function StaffContent({ shopId, role, currentUserId, isSuperAdmin, businessType }: StaffContentProps) {

  let whereClause: any = {
    role: { in: [Role.OWNER, Role.STAFF] }
  }
  
  if (isSuperAdmin && shopId === "ALL") {
    // No additional filters needed, keeps just the role filter.
  } else {
    whereClause.shopId = shopId
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const diffToMonday = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diffToMonday)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const rawMembers = await prisma.shopMember.findMany({
    where: whereClause,
    include: {
      user: {
        include: {
          appointmentsAsStaff: {
            where: {
              shopId,
              status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.PENDING] },
              startTime: { gte: weekStart, lte: weekEnd }
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


  const isOwner = role === Role.OWNER || isSuperAdmin
  const t = getTerminology(businessType as any)

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {rawMembers.map((member) => {
        const user = member.user
        const name = user.name || user.email.split("@")[0]
        const initials = name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
        
        const appointments = user.appointmentsAsStaff || []
        let todayAppointments = 0,
          weekAppointments = 0

        for (const appt of appointments) {
          const time = appt.startTime.getTime()
          if (time >= todayStart.getTime() && time <= todayEnd.getTime()) todayAppointments++
          if (time >= weekStart.getTime() && time <= weekEnd.getTime()) weekAppointments++
        }

        let specialty = t.client
        if (member.role === Role.OWNER) specialty = "Propietario / Gerente"
        else if (member.role === Role.STAFF) specialty = "Personal"
        else if (member.role === Role.SUPER_ADMIN) specialty = "Administrador"

        return (
          <StaffMemberCard
            key={member.id}
            shopId={shopId}
            staffId={user.id}
            isOwner={isOwner}
            currentUserRole={role as Role}
            currentUserId={currentUserId}
            isSuperAdmin={isSuperAdmin}
            businessType={businessType}
            schedules={user.staffSchedules}
            timeOff={user.staffTimeOff}
            terminology={t}
            stats={{
              name,
              initials,
              specialty,
              status: member.isActive ? "Activo" : "Inactivo",
              isActive: member.isActive,
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
