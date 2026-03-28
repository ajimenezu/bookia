"use client"

import { Search, Loader2 } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useEffect, useState } from "react"

export function ClientSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [term, setTerm] = useState(searchParams.get("q") || "")

  // Debounce effect
  useEffect(() => {
    // Skip the very first effect run if the term matches the initial search param
    const currentQuery = searchParams.get("q") || ""
    if (term === currentQuery) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (term) {
        params.set("q", term)
      } else {
        params.delete("q")
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [term, pathname, router, searchParams])

  return (
    <div className="relative">
      {isPending ? (
        <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
      ) : (
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-border bg-input pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring sm:w-64"
      />
    </div>
  )
}
