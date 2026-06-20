/**
 * Normalizes a raw phone number to the digits-only E.164 form WhatsApp expects
 * (no leading "+", no spaces/dashes). Costa Rica (506) is assumed when no
 * country code is present, since that's our canonical market.
 *
 * Returns null when there aren't enough digits to be a real number.
 */
export function toE164(raw: string | null | undefined, defaultCountry = "506"): string | null {
  if (!raw) return null

  // Keep digits only (drops "+", spaces, dashes, parentheses).
  let digits = raw.replace(/\D/g, "")
  if (!digits) return null

  // Local CR number (8 digits) -> prefix country code.
  if (digits.length === 8) {
    digits = defaultCountry + digits
  }

  // Reject anything too short to be a valid international number.
  if (digits.length < 10) return null

  return digits
}
