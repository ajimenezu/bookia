import type { WhatsAppSender } from "./sender"

/** A WhatsApp template "component" (e.g. the body with its positional params). */
export interface TemplateComponent {
  type: "body" | "header" | "button"
  parameters: Array<{ type: "text"; text: string }>
}

export interface SendTemplateArgs {
  /** Recipient in E.164 digits-only form (see phone.ts). */
  to: string
  /** Approved Meta template name. */
  templateName: string
  /** Template language code, e.g. "es". */
  languageCode: string
  /** Ordered components matching the approved template (usually just the body). */
  components: TemplateComponent[]
  /** Credentials/number to send from (see getShopWhatsAppSender). */
  sender: WhatsAppSender
}

/**
 * Sends a pre-approved template message via the Meta WhatsApp Cloud API.
 * Business-initiated messages (like our reminder) MUST use an approved template.
 *
 * Throws on a non-2xx response so callers can log; use the *Safe wrappers in
 * send-appointment-reminder.ts to avoid crashing a batch on one failure.
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode,
  components,
  sender,
}: SendTemplateArgs): Promise<{ messageId: string | null }> {
  const url = `https://graph.facebook.com/${sender.apiVersion}/${sender.phoneNumberId}/messages`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sender.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`WHATSAPP_SEND_FAILED ${res.status}: ${detail}`)
  }

  const data = (await res.json().catch(() => null)) as
    | { messages?: Array<{ id: string }> }
    | null
  return { messageId: data?.messages?.[0]?.id ?? null }
}
