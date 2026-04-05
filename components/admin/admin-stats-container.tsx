import { AdminStats } from "./admin-stats"
import { getAppointmentsInRange } from "@/lib/appointments"

export async function AdminStatsContainer({ shopId }: { shopId: string }) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfTime = new Date(2100, 0, 1) // Any far date
  
  // Use the library function instead of raw prisma call
  const monthlyAppointments = await getAppointmentsInRange(
    startOfMonth,
    endOfTime,
    shopId,
    "COMPLETED"
  )

  const totalBookings = monthlyAppointments.length
  const totalRevenue = monthlyAppointments.reduce((sum: number, app: any) => {
    // Check both legacy service and new multi-services Price logic
    const appPrice = app.priceAtBooking || app.service?.price || 0
    return sum + appPrice
  }, 0)

  return <AdminStats totalRevenue={totalRevenue} totalBookings={totalBookings} />
}
