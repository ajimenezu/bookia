import { getResendClient, EMAIL_FROM_DOMAIN } from "./client"
import { renderBookingNotificationStaff } from "./templates/booking-notification-staff"
import { getEmailTheme } from "./theme"
import type { BusinessType } from "@/lib/dictionaries"

export interface SendBookingNotificationStaffParams {
  recipients: string[]
  siteUrl: string
  shop: {
    name: string
    slug: string
    logoUrl: string | null
    businessType: BusinessType
  }
  customer: {
    name: string
    phone: string | null
    email: string | null
  }
  appointment: {
    startTime: Date
    endTime: Date
    services: Array<{ name: string; duration: number; price: number }>
    staffName: string | null
    totalPrice: number
  }
}

export async function sendBookingNotificationStaff(params: SendBookingNotificationStaffParams) {
  const { recipients, ...templateData } = params
  const uniqueRecipients = Array.from(new Set(recipients.map((r) => r.trim().toLowerCase()).filter(Boolean)))
  if (uniqueRecipients.length === 0) return

  const theme = getEmailTheme(templateData.shop.businessType, templateData.shop.slug)
  const { subject, html, text } = renderBookingNotificationStaff({ ...templateData, theme })

  const resend = getResendClient()
  const fromName = templateData.shop.name.replace(/[<>"]/g, "").slice(0, 60)

  const { error } = await resend.emails.send({
    from: `${fromName} <noreply@${EMAIL_FROM_DOMAIN}>`,
    to: uniqueRecipients,
    subject,
    html,
    text,
  })

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  }
}
