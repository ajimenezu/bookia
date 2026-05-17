import prisma from "@/lib/prisma"
import { sendBookingConfirmation } from "./send-booking-confirmation"
import { sendBookingNotificationStaff } from "./send-booking-notification-staff"

export async function triggerAppointmentNotifications(
  appointmentId: string,
  actionType: "CREATED" | "UPDATED" | "CANCELLED",
  notifyStaff: boolean = true
) {
  try {
    // 1. Fetch full appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        shop: {
          select: { name: true, slug: true, logoUrl: true, address: true, whatsappPhone: true, businessType: true }
        },
        staff: {
          select: { name: true, email: true }
        },
        customer: {
          select: { name: true, email: true, phone: true }
        },
        services: true
      }
    })

    if (!appointment) return
    const shop = appointment.shop

    // 2. Resolve Service Details (Use historical snapshot if available, else current services)
    const serviceDetails = (appointment.serviceDetails as Array<{ id: string; name: string; price: number }>) || []
    const services = serviceDetails.length > 0 
      ? serviceDetails.map(sd => {
          // Duration is not in the snapshot by default, try to find from relations or default to 30
          const rel = appointment.services.find(s => s.id === sd.id)
          return { name: sd.name, price: sd.price, duration: rel?.duration || 30 }
        })
      : appointment.services.map(s => ({ name: s.name, price: s.price, duration: s.duration }))

    // 3. Resolve Customer Details
    const customerName = appointment.customerName || appointment.customer?.name || "Cliente"
    const customerEmail = appointment.customerEmail || appointment.customer?.email
    const customerPhone = appointment.customerPhone || appointment.customer?.phone || null

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

    const appointmentPayload = {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      services,
      staffName: appointment.staff?.name || null,
      totalPrice: appointment.priceAtBooking,
    }

    // 4. Send Confirmation to Customer
    if (customerEmail) {
      void sendBookingConfirmationSafe({
        to: customerEmail,
        siteUrl,
        shop,
        customer: { name: customerName },
        appointment: appointmentPayload,
        actionType
      })
    }

    // 5. Send Notification to Staff
    if (notifyStaff) {
      const ownerships = await prisma.shopMember.findMany({
        where: { shopId: appointment.shopId, role: "OWNER" },
        select: { user: { select: { email: true } } }
      })

      const recipients: string[] = []
      if (appointment.staff?.email) recipients.push(appointment.staff.email)
      for (const o of ownerships) {
        if (o.user?.email) recipients.push(o.user.email)
      }

      if (recipients.length > 0) {
        void sendBookingNotificationStaffSafe({
          recipients,
          siteUrl,
          shop,
          customer: { name: customerName, email: customerEmail || null, phone: customerPhone },
          appointment: appointmentPayload,
          actionType
        })
      }
    }

  } catch (error) {
    console.error("TRIGGER_NOTIFICATIONS_ERROR:", error)
  }
}

async function sendBookingConfirmationSafe(args: any) {
  try {
    await sendBookingConfirmation(args)
  } catch (err) {
    console.error("BOOKING_EMAIL_ERROR:", err)
  }
}

async function sendBookingNotificationStaffSafe(args: any) {
  try {
    await sendBookingNotificationStaff(args)
  } catch (err) {
    console.error("STAFF_NOTIFICATION_EMAIL_ERROR:", err)
  }
}
