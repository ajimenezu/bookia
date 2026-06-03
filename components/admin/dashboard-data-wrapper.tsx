import { getAppointmentsData } from "@/lib/appointments"
import prisma from "@/lib/prisma"
import { DashboardContent } from "./dashboard-content"

interface DashboardDataWrapperProps {
  shopId: string
  businessType: string
  slug: string
  shopName: string
  whatsappPhone: string | null
}

export async function DashboardDataWrapper({ 
  shopId, 
  businessType, 
  slug, 
  shopName, 
  whatsappPhone 
}: DashboardDataWrapperProps) {
  const { todayAppointments, monthCount } = await getAppointmentsData(shopId)
  
  const [services, staffData, clientsData] = await Promise.all([
    prisma.service.findMany({ 
      where: { shopId }, 
      orderBy: { price: "asc" },
      include: { categories: true }
    }),
    prisma.shopMember.findMany({
      where: { shopId, role: { in: ["STAFF", "OWNER"] } },
      include: { 
        user: { 
          select: { 
            id: true, 
            name: true,
            staffServices: {
              where: { shopId },
              select: { id: true }
            }
          } 
        } 
      }
    }),
    prisma.shopMember.findMany({
      where: { shopId, role: "CUSTOMER" },
      include: { user: { select: { id: true, name: true, phone: true } } }
    })
  ])

  const mappedServices = services.map(s => ({
    id: s.id,
    name: s.name,
    price: s.price,
    duration: s.duration,
    categories: s.categories.map(c => c.name),
  }))

  const mappedStaff = staffData.map(m => ({
    id: m.userId,
    name: m.user.name || "Sin nombre",
    serviceIds: m.user.staffServices?.map(s => s.id) || [],
  }))

  const mappedClients = clientsData.map(m => ({
    id: m.userId,
    name: m.user.name || "Sin nombre",
    phone: m.user.phone,
  }))

  return (
    <DashboardContent 
      shopId={shopId}
      businessType={businessType}
      slug={slug}
      shopName={shopName}
      whatsappPhone={whatsappPhone}
      appointments={todayAppointments}
      monthCount={monthCount}
      mappedServices={mappedServices}
      mappedStaff={mappedStaff}
      mappedClients={mappedClients}
    />
  )
}
