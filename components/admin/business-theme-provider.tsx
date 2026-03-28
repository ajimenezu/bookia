"use client"

import { useLayoutEffect, useMemo } from "react"
import { BusinessType } from "@/lib/dictionaries"
import { getBusinessTokens } from "@/lib/tokens"

export function BusinessThemeProvider({ 
  businessType, 
  children 
}: { 
  businessType: BusinessType, 
  children: React.ReactNode 
}) {
  const tokens = useMemo(() => getBusinessTokens(businessType), [businessType])

  // Mapping tokens to CSS variables
  const cssVariables = useMemo(() => ({
    "--primary": tokens.primary,
    "--primary-foreground": tokens.primaryForeground,
    "--accent": tokens.accent,
    "--accent-foreground": tokens.accentForeground,
    "--ring": tokens.ring,
    "--background": tokens.background,
    "--foreground": tokens.foreground,
    "--card": tokens.card,
    "--card-foreground": tokens.cardForeground,
    "--popover": tokens.card,
    "--popover-foreground": tokens.cardForeground,
    "--secondary": tokens.secondary,
    "--secondary-foreground": tokens.secondaryForeground,
    "--muted": tokens.muted,
    "--muted-foreground": tokens.mutedForeground,
    "--border": tokens.border,
    "--input": tokens.input,
    "--sidebar": tokens.sidebar,
    "--sidebar-foreground": tokens.sidebarForeground,
    "--sidebar-primary": tokens.primary,
    "--sidebar-primary-foreground": tokens.primaryForeground,
    "--sidebar-accent": tokens.sidebarAccent,
    "--sidebar-border": tokens.sidebarBorder,
    "--sidebar-ring": tokens.ring,
    "--chart-1": tokens.primary,
    "--gold": tokens.primary,
    "--gold-foreground": tokens.primaryForeground,
  }), [tokens])

  // Inject variables into document.documentElement so Portals (Dialog, Select, etc.) 
  // can access them even if they are rendered outside this component's DOM tree.
  useLayoutEffect(() => {
    const root = document.documentElement
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [cssVariables])

  return (
    <div style={cssVariables as React.CSSProperties} className="min-h-screen">
      {children}
    </div>
  )
}
