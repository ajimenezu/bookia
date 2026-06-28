/**
 * Subdomain / multi-tenant domain helpers.
 *
 * Each shop is reachable at its own subdomain, e.g. `vanity-salon.mibookia.com`.
 * The proxy (lib/supabase/proxy.ts) rewrites that host onto the `app/[slug]/`
 * route tree, so the shop's `slug` and its subdomain label are the same string.
 *
 * NEXT_PUBLIC_ROOT_DOMAIN is the apex the app is served from:
 *   - prod:  "mibookia.com"
 *   - local: "localhost:3000"
 */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000"

/** Host portion of the root domain, without any port (e.g. "mibookia.com", "localhost"). */
const ROOT_HOST = ROOT_DOMAIN.split(":")[0].toLowerCase()

const IS_LOCAL = ROOT_HOST === "localhost" || ROOT_HOST === "127.0.0.1"

/**
 * Subdomains that are NOT shops. Hitting these resolves to platform-level
 * surfaces (marketing, email infra, etc.), never the `app/[slug]/` portal.
 * `send` is the Resend mail subdomain (send.mibookia.com).
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "mail",
  "send",
  "demo",
  "static",
  "assets",
])

/**
 * First path segments that are real apex routes (`app/<segment>/`), so they must
 * never be treated as a shop slug for the apex → subdomain canonical redirect.
 */
export const RESERVED_PATHS = new Set([
  "admin",
  "api",
  "auth",
  "demo",
  "login",
  "schedule",
])

/**
 * First path segments served by SHARED apex routes that must keep working on a
 * shop subdomain WITHOUT being rewritten onto `/[slug]/...` — e.g. the Supabase
 * OAuth callback (`/auth/callback`) and API handlers.
 */
export const SHARED_SUBDOMAIN_PATHS = new Set(["auth", "api"])

/**
 * Extract the shop subdomain from a Host header.
 * Returns the slug, or null for the apex, `www`, reserved subdomains, Vercel
 * preview hosts (`*.vercel.app`), or anything not under the root domain.
 */
export function getSubdomain(host: string | null | undefined): string | null {
  if (!host) return null
  const hostname = host.split(":")[0].toLowerCase()

  // Vercel preview/inspection deploys — no per-shop subdomain semantics.
  if (hostname.endsWith(".vercel.app")) return null

  if (hostname === ROOT_HOST || hostname === `www.${ROOT_HOST}`) return null
  if (!hostname.endsWith(`.${ROOT_HOST}`)) return null

  const sub = hostname.slice(0, -(`.${ROOT_HOST}`.length))
  // Only a single label is a valid shop subdomain (no nested `a.b.root`).
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null

  return sub
}

/** Canonical public URL for a shop portal, e.g. `https://vanity-salon.mibookia.com`. */
export function getShopUrl(slug: string): string {
  const protocol = IS_LOCAL ? "http" : "https"
  return `${protocol}://${slug}.${ROOT_DOMAIN}`
}

/**
 * Cookie domain for the Supabase session so ONE login is shared across every
 * shop subdomain (`.mibookia.com`). Undefined locally — browsers reject domain
 * cookies for `localhost`, so dev sessions stay host-only (log in per subdomain).
 */
export const COOKIE_DOMAIN = IS_LOCAL ? undefined : `.${ROOT_HOST}`
