import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSubdomain, getShopUrl, RESERVED_PATHS, SHARED_SUBDOMAIN_PATHS, COOKIE_DOMAIN } from "../domain";

/**
 * Handles per-shop subdomain routing + Supabase session management for the
 * Next.js 16 proxy layer.
 *
 * Routing:
 *   - `vanity-salon.mibookia.com/x` is rewritten onto `/vanity-salon/x` so the
 *     existing `app/[slug]/` tree serves it unchanged.
 *   - Legacy apex paths `mibookia.com/<slug>/...` get a 301 to the subdomain.
 *
 * The rewrite and the refreshed auth cookies must ride on a SINGLE response, so
 * the host decision is computed up front and the Supabase cookie handler rebuilds
 * that same response shape.
 */
export async function handleProxySession(request: NextRequest) {
  const host = request.headers.get("host");
  const subdomain = getSubdomain(host);
  const { pathname } = request.nextUrl;

  // Apex (or www) legacy path → canonical subdomain. First segment that is a
  // real apex route is left alone; anything else is treated as a shop slug.
  if (!subdomain) {
    const seg = pathname.split("/")[1];
    if (seg && !RESERVED_PATHS.has(seg)) {
      const rest = pathname.slice(seg.length + 1); // path after `/<slug>`
      const target = `${getShopUrl(seg)}${rest}${request.nextUrl.search}`;
      return NextResponse.redirect(target, 301);
    }
  }

  // On a shop subdomain, rewrite the host onto the `/[slug]` route tree — except
  // shared apex routes (OAuth callback, API), which serve as-is.
  const firstSeg = pathname.split("/")[1];
  const shouldRewrite = !!subdomain && !SHARED_SUBDOMAIN_PATHS.has(firstSeg);
  const effectivePath = shouldRewrite ? `/${subdomain}${pathname}` : pathname;

  const makeResponse = () => {
    if (!shouldRewrite) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = effectivePath;
    return NextResponse.rewrite(url, { request });
  };

  let supabaseResponse = makeResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : undefined,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = makeResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Ensure session is refreshed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect admin routes — redirect unauthenticated users to the shop login.
  // On a subdomain the browser stays on the subdomain (relative `/login`);
  // on apex/legacy access we keep the `/<slug>/login` form.
  const adminMatch = effectivePath.match(/^\/([^/]+)\/admin(\/|$)/);
  if (adminMatch && !user) {
    const url = request.nextUrl.clone();
    url.pathname = subdomain ? "/login" : `/${adminMatch[1]}/login`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
