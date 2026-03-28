import { handleProxySession } from "./lib/supabase/proxy";
import { type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy function. Replaces the deprecated middleware function.
 */
export async function proxy(request: NextRequest) {
  return await handleProxySession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets (svg, png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
