import { getAppointmentsInRange } from "@/lib/appointments"
import { getWeekRange } from "@/lib/date-utils"
import { CalendarView } from "./calendar-view"
import { ListView } from "./list-view"
import prisma from "@/lib/prisma"

import { BusinessType } from "@/lib/dictionaries"

interface AppointmentsContentProps {
  shopId: string
  businessType: BusinessType
  weekOffset: number
  view: "calendar" | "list"
}

export async function AppointmentsContent({ shopId, businessType, weekOffset, view }: AppointmentsContentProps) {
  const { sunday, monday, dates } = getWeekRange(weekOffset)
  
  // Parallel fetch for better performance
  const [appointments, services, staffData] = await Promise.all([
    getAppointmentsInRange(monday, sunday, shopId, undefined, "CANCELLED"),
    prisma.service.findMany({ where: { shopId }, orderBy: { price: "asc" } }),
    prisma.shopMember.findMany({
      where: { shopId, role: { in: ["STAFF", "OWNER"] } },
      include: { user: { select: { id: true, name: true } } }
    })
  ])

  const mappedServices = services.map(s => ({
    id: s.id,
    name: s.name,
    price: s.price,
    duration: s.duration,
  }))

  const mappedStaff = staffData.map(m => ({
    id: m.userId,
    name: m.user.name || "Sin nombre",
  }))

  const contentProps = {
    dates,
    appointments,
    shopId,
    businessType,
    services: mappedServices,
    staff: mappedStaff
  }

  return view === "calendar" ? (
    <CalendarView {...contentProps} />
  ) : (
    <ListView {...contentProps} />
  )
}
