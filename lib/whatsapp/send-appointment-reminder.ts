import { formatDate, formatTime } from "@/lib/date-utils"
import { WHATSAPP_REMINDER_TEMPLATE_NAME, WHATSAPP_TEMPLATE_LANG } from "./client"
import { toE164 } from "./phone"
import { getShopWhatsAppSender } from "./sender"
import { sendWhatsAppTemplate } from "./send-message"

/**
 * Day-before reminder over WhatsApp.
 *
 * Requires an APPROVED Meta template (Utility category). Register a template in
 * Meta Business Manager named `WHATSAPP_REMINDER_TEMPLATE_NAME` (lang
 * `WHATSAPP_TEMPLATE_LANG`) with a body using 4 positional params, e.g.:
 *
 *   Hola {{1}} 👋, te recordamos tu cita en {{2}} mañana {{3}} a las {{4}}.
 *   ¡Te esperamos!
 *
 *   {{1}} = customer name   {{2}} = shop name   {{3}} = date   {{4}} = time
 */
export interface AppointmentReminderInput {
  shop: { id: string; name: string; whatsappRemindersEnabled?: boolean }
  customerName: string
  /** Raw phone (any format); normalized to E.164 here. */
  customerPhone: string | null
  startTime: Date
}

/**
 * Sends one reminder. Returns true if a message was sent, false if it was
 * skipped (reminders disabled / no usable phone). Throws on send failure.
 */
export async function sendAppointmentReminder(input: AppointmentReminderInput): Promise<boolean> {
  if (input.shop.whatsappRemindersEnabled === false) return false

  const to = toE164(input.customerPhone)
  if (!to) return false

  const sender = await getShopWhatsAppSender(input.shop)

  await sendWhatsAppTemplate({
    to,
    templateName: WHATSAPP_REMINDER_TEMPLATE_NAME,
    languageCode: WHATSAPP_TEMPLATE_LANG,
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: input.customerName },
          { type: "text", text: input.shop.name },
          { type: "text", text: formatDate(input.startTime) },
          { type: "text", text: formatTime(input.startTime) },
        ],
      },
    ],
    sender,
  })

  return true
}

/**
 * Error-swallowing wrapper (mirrors sendBookingConfirmationSafe in lib/email).
 * Returns true only on a confirmed send so a batch never crashes on one failure.
 */
export async function sendAppointmentReminderSafe(
  input: AppointmentReminderInput
): Promise<boolean> {
  try {
    return await sendAppointmentReminder(input)
  } catch (err) {
    console.error("WHATSAPP_REMINDER_ERROR:", err)
    return false
  }
}
