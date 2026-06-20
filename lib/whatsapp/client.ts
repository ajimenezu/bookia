// Meta WhatsApp Cloud API configuration.
// Mirrors lib/email/client.ts (getResendClient / EMAIL_FROM_DOMAIN): we don't
// have an official SDK, so we hit the Graph API with fetch in send-message.ts.

export interface WhatsAppConfig {
  /** Platform sender's phone number id (from Meta -> WhatsApp -> API Setup). */
  phoneNumberId: string
  /** Long-lived System User access token (or the 24h dev token). */
  accessToken: string
  /** Graph API version, e.g. "v21.0". */
  apiVersion: string
}

/**
 * Reads the platform WhatsApp credentials from the environment.
 * Throws a clear error if the required vars are missing (mirrors getResendClient).
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      "MISSING_WHATSAPP_CONFIG: set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in your environment"
    )
  }

  return {
    phoneNumberId,
    accessToken,
    apiVersion: process.env.WHATSAPP_API_VERSION ?? "v21.0",
  }
}

/** Approved Meta template used for the day-before reminder (see send-appointment-reminder.ts). */
export const WHATSAPP_REMINDER_TEMPLATE_NAME =
  process.env.WHATSAPP_REMINDER_TEMPLATE_NAME ?? "appointment_reminder"

/** Language code of the approved template, e.g. "es". */
export const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG ?? "es"
