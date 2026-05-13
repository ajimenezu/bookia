import { AppointmentStatus } from "@prisma/client"
import prisma from "./prisma"
import { toCRDate, fromCRDate } from "./date-utils"


/**
 * Calculates the total price of an appointment handling historical snapshots and multiple services.
 * Priority: 
 * 1. priceAtBooking (Snapshotted total)
 * 2. serviceDetails JSON (Historical service names/prices)
 * 3. services array (Current relations)
 * 4. service object (Legacy single service)
 */
export function calculateAppointmentPrice(appointment: any): number {
  if (appointment.priceAtBooking !== null && appointment.priceAtBooking !== undefined) {
    return appointment.priceAtBooking
  }

  // Handle serviceDetails snapshot (JSON array of {id, name, price})
  if (appointment.serviceDetails && Array.isArray(appointment.serviceDetails)) {
    return appointment.serviceDetails.reduce((acc: number, s: any) => acc + (s.price || 0), 0)
  }

  // Handle current services relationship
  if (appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) {
    return appointment.services.reduce((acc: number, s: any) => acc + (s.price || 0), 0)
  }

  // Fallback to legacy single service
  return appointment.service?.price || 0
}

/**
 * Formats the services name string handling snapshots and relations.
 */
export function getAppointmentServicesName(appointment: any): string {
  if (appointment.serviceDetails && Array.isArray(appointment.serviceDetails)) {
    return appointment.serviceDetails.map((s: any) => s.name).join(", ")
  }

  if (appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) {
    return appointment.services.map((s: any) => s.name).join(", ")
  }

  return appointment.service?.name || "Servicio no especificado"
}

/**
 * Fetches dashboard data for a specific shop:
 * - Today's appointments (full objects)
 * - Current month's total appointment count (excluding cancelled)
 */
export async function getAppointmentsData(shopId: string) {
  const crNow = toCRDate(new Date())
  
  // Today's boundaries in CR Time
  const todayStart = new Date(crNow)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(crNow)
  todayEnd.setHours(23, 59, 59, 999)
  
  // Month boundaries in CR Time
  const monthStart = new Date(crNow.getFullYear(), crNow.getMonth(), 1, 0, 0, 0, 0)
  const monthEnd = new Date(crNow.getFullYear(), crNow.getMonth() + 1, 0, 23, 59, 59, 999)

  const [todayAppointments, monthCount] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        shopId,
        startTime: {
          gte: fromCRDate(todayStart),
          lte: fromCRDate(todayEnd)
        }
      },
      include: {
        services: true,
        service: true,
        staff: true,
        customer: true
      },
      orderBy: { startTime: "asc" }
    }),
    prisma.appointment.count({
      where: {
        shopId,
        startTime: {
          gte: fromCRDate(monthStart),
          lte: fromCRDate(monthEnd)
        },
        status: { not: "CANCELLED" }
      }
    })
  ])

  return { todayAppointments, monthCount }
}
