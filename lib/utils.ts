import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string | null) {
  if (!address) return ""
  
  // Example: "8HC9+WW5, Alajuela Province, Ciudad Quesada, Costa Rica"
  // Split by comma and filter out parts that look like Plus Codes or "Costa Rica"
  const parts = address.split(",").map(p => p.trim())
  const filtered = parts.filter(p => {
    const isPlusCode = p.includes("+")
    const isCountry = p.toLowerCase() === "costa rica"
    return !isPlusCode && !isCountry
  })

  // Take the first two relevant parts (e.g., Province, City)
  if (filtered.length >= 2) {
    return `${filtered[0]}, ${filtered[1]}`
  }

  return filtered[0] || address
}
