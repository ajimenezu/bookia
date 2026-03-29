import { BusinessType } from "./dictionaries"

export interface BusinessPalette {
  // Brand colors
  primary: string
  primaryForeground: string
  accent: string
  accentForeground: string
  ring: string
  // Surface colors
  background: string
  foreground: string
  card: string
  cardForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  // Sidebar
  sidebar: string
  sidebarForeground: string
  sidebarAccent: string
  sidebarBorder: string
}

export const BUSINESS_TOKENS: Record<BusinessType, BusinessPalette> = {
  BARBERIA: {
    // Elegant Gold / Dark theme
    primary: "oklch(0.78 0.12 75)",
    primaryForeground: "oklch(0.13 0.005 80)",
    accent: "oklch(0.78 0.12 75)",
    accentForeground: "oklch(0.13 0.005 80)",
    ring: "oklch(0.78 0.12 75)",
    background: "oklch(0.13 0.005 80)",
    foreground: "oklch(0.95 0.01 80)",
    card: "oklch(0.17 0.005 80)",
    cardForeground: "oklch(0.95 0.01 80)",
    secondary: "oklch(0.22 0.005 80)",
    secondaryForeground: "oklch(0.90 0.01 80)",
    muted: "oklch(0.20 0.005 80)",
    mutedForeground: "oklch(0.60 0.01 80)",
    border: "oklch(0.26 0.005 80)",
    input: "oklch(0.22 0.005 80)",
    sidebar: "oklch(0.10 0.005 80)",
    sidebarForeground: "oklch(0.90 0.01 80)",
    sidebarAccent: "oklch(0.20 0.01 75)",
    sidebarBorder: "oklch(0.22 0.005 80)"
  },
  SALON_BELLEZA: {
    // Rose Gold / Light & airy theme
    primary: "oklch(0.65 0.18 12)",
    primaryForeground: "oklch(0.99 0.005 0)",
    accent: "oklch(0.80 0.08 12)",
    accentForeground: "oklch(0.25 0.02 12)",
    ring: "oklch(0.65 0.18 12)",
    background: "oklch(0.97 0.005 80)",
    foreground: "oklch(0.18 0.02 80)",
    card: "oklch(1.00 0 0)",
    cardForeground: "oklch(0.18 0.02 80)",
    secondary: "oklch(0.93 0.01 12)",
    secondaryForeground: "oklch(0.35 0.03 12)",
    muted: "oklch(0.92 0.005 80)",
    mutedForeground: "oklch(0.45 0.02 80)",
    border: "oklch(0.88 0.01 80)",
    input: "oklch(0.93 0.005 80)",
    sidebar: "oklch(0.99 0.005 12)",
    sidebarForeground: "oklch(0.25 0.02 12)",
    sidebarAccent: "oklch(0.94 0.03 12)",
    sidebarBorder: "oklch(0.90 0.01 12)"
  },
  SPA: {
    // Soft Teal / Tranquil light theme
    primary: "oklch(0.55 0.12 180)",
    primaryForeground: "oklch(0.98 0.005 180)",
    accent: "oklch(0.75 0.06 180)",
    accentForeground: "oklch(0.20 0.03 180)",
    ring: "oklch(0.55 0.12 180)",
    background: "oklch(0.97 0.005 180)",
    foreground: "oklch(0.18 0.02 180)",
    card: "oklch(1.00 0 0)",
    cardForeground: "oklch(0.18 0.02 180)",
    secondary: "oklch(0.92 0.01 180)",
    secondaryForeground: "oklch(0.35 0.03 180)",
    muted: "oklch(0.92 0.005 180)",
    mutedForeground: "oklch(0.45 0.02 180)",
    border: "oklch(0.88 0.01 180)",
    input: "oklch(0.93 0.005 180)",
    sidebar: "oklch(0.98 0.005 180)",
    sidebarForeground: "oklch(0.25 0.02 180)",
    sidebarAccent: "oklch(0.93 0.03 180)",
    sidebarBorder: "oklch(0.90 0.01 180)"
  },
  CLINICA: {
    // Professional Medical Blue / Clean light theme
    primary: "oklch(0.50 0.18 250)",
    primaryForeground: "oklch(0.98 0.005 250)",
    accent: "oklch(0.75 0.06 250)",
    accentForeground: "oklch(0.20 0.03 250)",
    ring: "oklch(0.50 0.18 250)",
    background: "oklch(0.97 0.003 250)",
    foreground: "oklch(0.18 0.02 250)",
    card: "oklch(1.00 0 0)",
    cardForeground: "oklch(0.18 0.02 250)",
    secondary: "oklch(0.93 0.01 250)",
    secondaryForeground: "oklch(0.35 0.03 250)",
    muted: "oklch(0.92 0.005 250)",
    mutedForeground: "oklch(0.45 0.02 250)",
    border: "oklch(0.88 0.01 250)",
    input: "oklch(0.93 0.005 250)",
    sidebar: "oklch(0.98 0.005 250)",
    sidebarForeground: "oklch(0.25 0.02 250)",
    sidebarAccent: "oklch(0.93 0.03 250)",
    sidebarBorder: "oklch(0.90 0.01 250)"
  }
}

export const CUSTOM_BUSINESS_TOKENS: Record<string, BusinessPalette> = {
  "vanity-studio": {
    // Premium Light Violet & Gold theme
    primary: "oklch(0.55 0.20 290)",
    primaryForeground: "oklch(0.99 0.01 290)",
    accent: "oklch(0.82 0.12 85)",
    accentForeground: "oklch(0.35 0.05 85)",
    ring: "oklch(0.55 0.20 290)",
    background: "oklch(0.98 0.005 290)",
    foreground: "oklch(0.15 0.03 290)",
    card: "oklch(1.00 0 0)",
    cardForeground: "oklch(0.15 0.03 290)",
    secondary: "oklch(0.95 0.02 290)",
    secondaryForeground: "oklch(0.35 0.08 290)",
    muted: "oklch(0.96 0.01 290)",
    mutedForeground: "oklch(0.45 0.05 290)",
    border: "oklch(0.90 0.02 290)",
    input: "oklch(0.95 0.01 290)",
    sidebar: "oklch(0.99 0.005 290)",
    sidebarForeground: "oklch(0.30 0.05 290)",
    sidebarAccent: "oklch(0.94 0.03 290)",
    sidebarBorder: "oklch(0.92 0.01 290)"
  }
}

export function getBusinessTokens(
  businessType: BusinessType = "BARBERIA",
  slug?: string
): BusinessPalette {
  if (slug && CUSTOM_BUSINESS_TOKENS[slug]) {
    return CUSTOM_BUSINESS_TOKENS[slug]
  }
  return BUSINESS_TOKENS[businessType] || BUSINESS_TOKENS.SALON_BELLEZA
}