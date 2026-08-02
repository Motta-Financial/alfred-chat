import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Pass through auth routes without session check
  if (pathname.startsWith("/login") || pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  // Fast path: Supabase stores its session in `sb-<ref>-auth-token*` cookies.
  // If none exist there is no session to validate — redirect straight to
  // /login without paying for a network round-trip to Supabase on every hit.
  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"))
  if (!hasAuthCookie) {
    return redirectToLogin(request, pathname, search)
  }

  const response = NextResponse.next({
    request,
  })

  const cookieDomain = process.env.SUPABASE_COOKIE_DOMAIN

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              ...(cookieDomain ? { domain: cookieDomain } : {}),
              sameSite: "lax",
              secure: true,
            })
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirectToLogin(request, pathname, search)
  }

  return response
}

/** Redirect to /login, preserving the originally requested URL so the
 *  login page can bounce the user back after Hub authentication. */
function redirectToLogin(request: NextRequest, pathname: string, search: string) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = "/login"
  loginUrl.search = ""
  if (pathname !== "/" || search) {
    loginUrl.searchParams.set("next", `${pathname}${search}`)
  }
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
