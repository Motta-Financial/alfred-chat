import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const cookieDomain = process.env.SUPABASE_COOKIE_DOMAIN

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
                sameSite: "lax",
                secure: true,
              }),
            )
          } catch {
            // setAll called from a Server Component — cookies can only be
            // mutated in middleware or route handlers, so this is expected.
          }
        },
      },
    },
  )
}
