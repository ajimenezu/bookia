import prisma from "@/lib/prisma"
import { AppointmentStatus } from "@prisma/client"

export async function getAppointmentsData(shopId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return getAppointmentsInRange(startOfDay, endOfDay, shopId);
}

export async function getAppointmentsInRange(
  startDate: Date, 
  endDate: Date, 
  shopId: string,
  status?: AppointmentStatus
) {
  // SECURITY: Mandatory shopId filtering
  if (!shopId) {
    throw new Error("shopId is required for security isolation");
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      // If shopId is "ALL", don't filter (ONLY for internal/super-admin use)
      ...(shopId !== "ALL" ? { shopId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: {
      startTime: "asc",
    },
    include: {
      customer: true,
      service: true,
      services: true,
      staff: true,
    },
  })
  return appointments
}

