"use client"

import { useState } from "react"
import { Check, Copy, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getShopUrl } from "@/lib/domain"

/**
 * Read-only display of the shop's public subdomain portal URL with a copy button,
 * so owners can advertise e.g. https://vanity-salon.mibookia.com.
 */
export function ShopPortalLink({ slug }: { slug: string }) {
  const url = getShopUrl(slug)
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Link2 className="h-4 w-4 text-primary" />
        Tu enlace público
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Comparte este enlace para que tus clientes reserven en tu portal.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm">{url}</code>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="ml-2">{copied ? "Copiado" : "Copiar"}</span>
        </Button>
      </div>
    </div>
  )
}
