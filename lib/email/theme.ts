import type { BusinessType } from "@/lib/dictionaries"

export interface EmailTheme {
  primary: string       // hex, e.g. "#e4ac59"
  primaryFg: string     // hex contrasting text on primary
  accentStrip: string   // hex, usually = primary
}

// Hex equivalents of the OKLch values in lib/tokens.ts (primary + primaryForeground only).
// Email clients don't reliably render OKLch, so we use precomputed hex values.
// To regenerate after editing lib/tokens.ts, run:
//   node -e "const{formatHex,parse}=require('culori');console.log(formatHex(parse('oklch(0.78 0.12 75)')))"
const BUSINESS_HEX: Record<BusinessType, { primary: string; primaryFg: string }> = {
  BARBERIA:      { primary: "#e4ac59", primaryFg: "#080706" },
  SALON_BELLEZA: { primary: "#e75572", primaryFg: "#fffafc" },
  SPA:           { primary: "#008774", primaryFg: "#f5faf8" },
  CLINICA:       { primary: "#0063c4", primaryFg: "#f6f9fc" },
}

const CUSTOM_SLUG_HEX: Record<string, { primary: string; primaryFg: string }> = {
  "vanity-studio": { primary: "#7552db", primaryFg: "#fbfbff" },
}

export const DEFAULT_EMAIL_THEME: EmailTheme = {
  primary: "#0070f3",
  primaryFg: "#ffffff",
  accentStrip: "#0070f3",
}

export function getEmailTheme(
  businessType?: BusinessType | null,
  slug?: string | null
): EmailTheme {
  const colors =
    (slug && CUSTOM_SLUG_HEX[slug]) ||
    (businessType && BUSINESS_HEX[businessType]) ||
    null

  if (!colors) return DEFAULT_EMAIL_THEME

  return {
    primary: colors.primary,
    primaryFg: colors.primaryFg,
    accentStrip: colors.primary,
  }
}
