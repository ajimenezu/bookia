import { getWhatsAppConfig, type WhatsAppConfig } from "./client"

/** The credentials a message is sent FROM. */
export type WhatsAppSender = Pick<WhatsAppConfig, "phoneNumberId" | "accessToken" | "apiVersion">

/** Minimal shop shape needed to resolve a sender (kept loose so any select works). */
type ShopForSender = { id: string; whatsappRemindersEnabled?: boolean }

/**
 * Resolves which WhatsApp sender to use for a given shop.
 *
 * ─── EXTENSION POINT ───────────────────────────────────────────────────────
 * Today every shop sends from the single platform-owned Bookia sender.
 * When a tenant wants to send from THEIR OWN WhatsApp number, this is the only
 * place that changes: look up the tenant's credentials (ideally pulled from
 * Supabase Vault keyed by shop.id, NOT plaintext DB columns) and return those
 * instead of the platform defaults. The rest of the pipeline (send-message,
 * send-appointment-reminder, the cron) stays untouched.
 * ───────────────────────────────────────────────────────────────────────────
 */
export async function getShopWhatsAppSender(_shop: ShopForSender): Promise<WhatsAppSender> {
  // Per-shop override would go here (e.g. await getTenantSenderFromVault(_shop.id)).
  return getWhatsAppConfig()
}
