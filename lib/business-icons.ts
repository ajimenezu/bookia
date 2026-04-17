import { Scissors, Sparkles, Flower2, Stethoscope, Sparkle, type LucideIcon } from "lucide-react"
import { BusinessType } from "./dictionaries"

export function getBusinessIcon(type?: BusinessType | null): LucideIcon {
  switch (type) {
    case "BARBERIA":
      return Scissors
    case "SALON_BELLEZA":
      return Sparkles
    case "SPA":
      return Flower2
    case "CLINICA":
      return Stethoscope
    default:
      return Sparkle
  }
}
