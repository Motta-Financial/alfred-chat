import { createBrowserClient } from "@supabase/ssr"

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env"

// Server-side cookie writes (middleware.ts, server.ts, auth/callback) scope
// the session cookie to SUPABASE_COOKIE_DOMAIN. That var is NOT
// NEXT_PUBLIC_-prefixed, so it is unavailable here — this browser client
// needs its own build-time-inlined copy, or every client-side token
// refresh (autoRefreshToken, and getBearerToken's refreshSession call)
// writes a host-only cookie that shadows the shared .motta.cpa one.
const cookieDomain = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: "/",
      sameSite: "lax",
      secure: true,
    },
  })
}
