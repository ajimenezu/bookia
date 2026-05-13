import { AdminStats } from "./admin-stats"
import { getAppointmentsInRange, calculateAppointmentPrice } from "@/lib/appointments"
import { toCRDate } from "@/lib/date-utils"
import { BusinessType } from "@/lib/dictionaries"

export async function AdminStatsContainer({ shopId, businessType }: { shopId: string, businessType: BusinessType }) {
  const now = new Date()
  const crNow = toCRDate(now)
  const startOfMonthCR = new Date(crNow.getFullYear(), crNow.getMonth(), 1)
  const endOfTime = new Date(2100, 0, 1) 
  
  // Fetch both CONFIRMED and COMPLETED to show realistic monthly performance
  const monthlyAppointments = await getAppointmentsInRange(
    startOfMonthCR,
    endOfTime,
    shopId
  )

  // Filter to ensure we only count non-cancelled active appointments for revenue
  const validAppointments = monthlyAppointments.filter(app => 
    ["CONFIRMED", "COMPLETED"].includes(app.status)
  )

  const totalBookings = validAppointments.length
  const totalRevenue = validAppointments.reduce((sum: number, app: any) => {
    // Use centralized price calculation logic (handles snapshots and multi-services)
    return sum + calculateAppointmentPrice(app)
  }, 0)

  return <AdminStats totalRevenue={totalRevenue} totalBookings={totalBookings} businessType={businessType} />
}
