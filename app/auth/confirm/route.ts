import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/"

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error) {
    return NextResponse.redirect(new URL("/login?error=expired-link", request.url))
  }

  // Resolve `next` against the request URL — handles both absolute URLs (from
  // {{ .RedirectTo }} substitution in email templates) and bare paths.
  // Same-origin enforcement prevents open-redirect.
  const requestUrl = new URL(request.url)
  let dest: URL
  try {
    dest = new URL(next, requestUrl)
  } catch {
    dest = new URL("/", requestUrl)
  }
  if (dest.origin !== requestUrl.origin) {
    dest = new URL("/", requestUrl)
  }

  return NextResponse.redirect(dest)
}
