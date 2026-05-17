import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { buildHubLoginUrl } from "@/lib/hub"
import { LogoImage } from "@/components/alfred-chat/LogoImage"

/**
 * ALFRED has no sign-in form of its own. Authentication is owned by the
 * Motta Hub at app.motta.cpa, and Supabase auth cookies are shared
 * across .motta.cpa via SUPABASE_COOKIE_DOMAIN.
 *
 * If a user lands here with an active session, send them straight to
 * the chat. Otherwise, bounce to the Hub's /login with a redirect
 * param so they come back here once authenticated.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Already signed in via the shared Hub session -> straight into the app
  if (user) {
    redirect(next ?? "/")
  }

  // Compute the return-to that the Hub should redirect us back to once
  // the user authenticates there. Fall back to the alfred origin root.
  const alfredOrigin =
    process.env.NEXT_PUBLIC_ALFRED_ORIGIN ?? "https://alfred.motta.cpa"
  const returnTo = `${alfredOrigin}${next ?? "/"}`
  const hubLoginUrl = buildHubLoginUrl(returnTo)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAE6E1]">
      <div className="w-full max-w-sm space-y-8 px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 flex items-center justify-center">
            <LogoImage size={64} className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Sign in to ALFRED
            </h1>
            <p className="mt-1 text-sm text-gray-500">Motta Hub Assistant</p>
          </div>
        </div>

        {error === "auth_callback_failed" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            That sign-in link could not be verified. Please try again from
            the Motta Hub.
          </div>
        ) : null}

        <div className="rounded-xl border border-[#8E9B79]/40 bg-[#8E9B79]/10 p-6 space-y-4">
          <p className="text-sm text-[#4a5240]">
            ALFRED uses your Motta Hub account. Sign in there once and you
            will have access here automatically.
          </p>
          <a
            href={hubLoginUrl}
            className="inline-flex w-full items-center justify-center rounded-md bg-[#6B745D] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#4a5240] focus:outline-none focus:ring-2 focus:ring-[#6B745D] focus:ring-offset-2"
          >
            Continue to Motta Hub
          </a>
        </div>

        <p className="text-xs text-gray-400">
          Restricted to @motta.cpa and @mottafinancial.com accounts.
        </p>
      </div>
    </div>
  )
}
