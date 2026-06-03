import { Resend } from "resend"

let cached: Resend | null = null

export function getResendClient(): Resend {
  if (cached) return cached
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("MISSING_RESEND_API_KEY: set RESEND_API_KEY in your environment")
  }
  cached = new Resend(apiKey)
  return cached
}

// Single sending domain configured in Resend (send.mibookia.com).
// Override per-environment with EMAIL_FROM_DOMAIN if needed.
export const EMAIL_FROM_DOMAIN = process.env.EMAIL_FROM_DOMAIN ?? "send.mibookia.com"
