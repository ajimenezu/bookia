import { createBrowserClient } from '@supabase/ssr'
import { COOKIE_DOMAIN } from '@/lib/domain'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : undefined,
    }
  )
}
