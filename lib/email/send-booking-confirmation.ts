import { getResendClient, EMAIL_FROM_DOMAIN } from "./client"
import { renderBookingConfirmation } from "./templates/booking-confirmation"
import { getEmailTheme } from "./theme"
import type { BusinessType } from "@/lib/dictionaries"

export interface SendBookingConfirmationParams {
  to: string
  replyTo?: string | null
  siteUrl: string
  shop: {
    name: string
    slug: string
    logoUrl: string | null
    address: string | null
    whatsappPhone: string | null
    businessType: BusinessType
  }
  customer: { name: string }
  appointment: {
    startTime: Date
    endTime: Date
    services: Array<{ name: string; duration: number; price: number }>
    staffName: string | null
    totalPrice: number
  }
}

export async function sendBookingConfirmation(params: SendBookingConfirmationParams) {
  const { to, replyTo, ...templateData } = params
  const theme = getEmailTheme(templateData.shop.businessType, templateData.shop.slug)
  const { subject, html, text } = renderBookingConfirmation({ ...templateData, theme })

  const resend = getResendClient()
  const fromName = templateData.shop.name.replace(/[<>"]/g, "").slice(0, 60)

  const { error } = await resend.emails.send({
    from: `${fromName} <noreply@${EMAIL_FROM_DOMAIN}>`,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  })

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  }
}
