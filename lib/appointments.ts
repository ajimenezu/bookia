import prisma from "@/lib/prisma"
import { AppointmentStatus } from "@prisma/client"
import { toCRDate, fromCRDate } from "@/lib/date-utils"

export async function getAppointmentsData(shopId: string) {
  const now = new Date();
  const crNow = toCRDate(now);
  const startOfDayCR = new Date(crNow.getFullYear(), crNow.getMonth(), crNow.getDate());
  const endOfDayCR = new Date(crNow.getFullYear(), crNow.getMonth(), crNow.getDate(), 23, 59, 59, 999);

  return getAppointmentsInRange(fromCRDate(startOfDayCR), fromCRDate(endOfDayCR), shopId);
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

