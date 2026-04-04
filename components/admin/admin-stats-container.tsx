import { AdminStats } from "./admin-stats"
import prisma from "@/lib/prisma"

export async function AdminStatsContainer({ shopId }: { shopId: string }) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const monthlyAppointments = await prisma.appointment.findMany({
    where: { 
      AND: [
        { shopId: shopId }, 
        { status: "COMPLETED" }, 
        { startTime: { gte: startOfMonth } }
      ] 
    },
    include: { service: true }
  })

  const totalBookings = monthlyAppointments.length
  const totalRevenue = monthlyAppointments.reduce((sum: number, app: any) => sum + (app.service?.price || 0), 0)

  return <AdminStats totalRevenue={totalRevenue} totalBookings={totalBookings} />
}
