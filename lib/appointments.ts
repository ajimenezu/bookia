import prisma from "@/lib/prisma"
import { AppointmentStatus } from "@prisma/client"
import { toCRDate, fromCRDate } from "@/lib/date-utils"

export async function getAppointmentsData(shopId: string) {
  const now = new Date();
  const crNow = toCRDate(now);
  
  // Today's range
  const startOfDayCR = new Date(crNow.getFullYear(), crNow.getMonth(), crNow.getDate());
  const endOfDayCR = new Date(crNow.getFullYear(), crNow.getMonth(), crNow.getDate(), 23, 59, 59, 999);

  // Month's range
  const startOfMonthCR = new Date(crNow.getFullYear(), crNow.getMonth(), 1);
  const nextMonth = crNow.getMonth() + 1;
  const endOfMonthCR = new Date(crNow.getFullYear(), nextMonth, 0, 23, 59, 59, 999);

  const [todayAppointments, monthCount] = await Promise.all([
    getAppointmentsInRange(fromCRDate(startOfDayCR), fromCRDate(endOfDayCR), shopId, undefined, "CANCELLED" as AppointmentStatus),
    prisma.appointment.count({
      where: {
        startTime: {
          gte: fromCRDate(startOfMonthCR),
          lte: fromCRDate(endOfMonthCR),
        },
        ...(shopId !== "ALL" ? { shopId } : {}),
        status: { not: "CANCELLED" }
      }
    })
  ]);

  return { todayAppointments, monthCount };
}

export async function getAppointmentsInRange(
  startDate: Date, 
  endDate: Date, 
  shopId: string,
  status?: AppointmentStatus,
  excludeStatus?: AppointmentStatus
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
      ...(excludeStatus ? { status: { not: excludeStatus } } : {}),
    },
    orderBy: {
      startTime: "asc",
    },
    include: {
      customer: true,
      service: true,
      services: true,
      staff: true,
      notes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    },
  })
  return appointments
}

