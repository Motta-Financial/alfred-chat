import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { buildHubLoginUrl } from "@/lib/hub"
import { LogoImage } from "@/components/alfred-chat/LogoImage"

/**
 * ALFRED has no sign-in form of its own. Authentication is owned by the
 * Motta Hub at hub.motta.cpa, and Supabase auth cookies are shared
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

  // `next` is attacker-controlled (URL query param). Only accept an
  // in-app relative path — anything else (protocol-relative `//evil.com`,
  // userinfo tricks like `@evil.com`, absolute URLs) collapses to "/".
  // Both uses below run unconditionally on every visit, not just the
  // signed-in branch.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Already signed in via the shared Hub session -> straight into the app
  if (user) {
    redirect(safeNext)
  }

  // Compute the return-to that the Hub should redirect us back to once
  // the user authenticates there. Fall back to the alfred origin root.
  const alfredOrigin =
    process.env.NEXT_PUBLIC_ALFRED_ORIGIN ?? "https://alfred.motta.cpa"
  const returnTo = `${alfredOrigin}${safeNext}`
  const hubLoginUrl = buildHubLoginUrl(returnTo)

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative h-20 w-20">
            <div className="animate-aura absolute -inset-3 rounded-full bg-sage/40 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-ink-3 ring-1 ring-brass/40">
              <span aria-hidden className="absolute font-display text-3xl text-ivory/90">
                A
              </span>
              <LogoImage size={64} className="relative rounded-full object-contain" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-4xl font-light tracking-wide text-ivory">ALFRED</h1>
            <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-ivory/40">
              Motta Hub Assistant
            </p>
          </div>
        </div>

        {error === "auth_callback_failed" ? (
          <div className="rounded-xl bg-red-950/50 p-4 text-sm text-red-300 ring-1 ring-red-400/25">
            That sign-in link could not be verified. Please try again from
            the Motta Hub.
          </div>
        ) : null}

        <div className="space-y-4 rounded-2xl bg-paper-2 p-6 shadow-console">
          <p className="text-sm leading-relaxed text-muted-foreground">
            ALFRED uses your Motta Hub account. Sign in there once and you
            will have access here automatically.
          </p>
          <a
            href={hubLoginUrl}
            className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-moss-deep focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 focus:ring-offset-paper-2"
          >
            Continue to Motta Hub
          </a>
        </div>

        <p className="text-xs text-ivory/30">
          Restricted to @motta.cpa and @mottafinancial.com accounts.
        </p>
      </div>
    </div>
  )
}
