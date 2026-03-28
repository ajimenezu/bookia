import prisma from "@/lib/prisma"

export async function getAppointmentsData(shopId?: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return getAppointmentsInRange(startOfDay, endOfDay, shopId);
}

export async function getAppointmentsInRange(startDate: Date, endDate: Date, shopId?: string) {
  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      // If shopId is "ALL", don't filter (for Super Admin)
      // If shopId is provided, filter by it
      ...(shopId && shopId !== "ALL" ? { shopId } : {}),
    },
    orderBy: {
      startTime: "asc",
    },
    include: {
      customer: true,
      service: true,
      staff: true,
    },
  })
  return appointments
}
