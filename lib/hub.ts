import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Hub endpoints. We resolve lazily so missing env vars surface at the
 * moment the chat actually tries to talk to the Hub (loud, traceable
 * runtime error in the browser) instead of crashing the build.
 */
function readHubUrl(name: string): string {
  const value = process.env[name]
  if (!value || value.length === 0) {
    throw new Error(
      `[alfred-chat] Missing required env var ${name}. ` +
        `Set it on the Vercel project (e.g. https://app.motta.cpa/api/alfred/...).`,
    )
  }
  return value
}

// Property getters so accidental top-level reads still throw, but module
// import does not. Consumers do `HUB_CHAT_URL` exactly as before.
export const HUB_CHAT_URL: string = (process.env.NEXT_PUBLIC_HUB_CHAT_URL as string) || ""
export const HUB_CONVERSATIONS_URL: string =
  (process.env.NEXT_PUBLIC_HUB_CONVERSATIONS_URL as string) || ""

/** Throw if either Hub URL is missing. Call before any fetch to the Hub. */
export function assertHubConfigured(): void {
  readHubUrl("NEXT_PUBLIC_HUB_CHAT_URL")
  readHubUrl("NEXT_PUBLIC_HUB_CONVERSATIONS_URL")
}

export async function getBearerToken(supabase: SupabaseClient): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    throw new Error("No active Supabase session")
  }

  // Refresh if within 60 seconds of expiry
  const expiresAt = session.expires_at ?? 0
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (expiresAt - nowSeconds < 60) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshed.session) {
      throw new Error("Failed to refresh Supabase session")
    }
    return refreshed.session.access_token
  }

  return session.access_token
}
