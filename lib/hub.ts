import type { SupabaseClient } from "@supabase/supabase-js"

export const HUB_CHAT_URL = process.env.NEXT_PUBLIC_HUB_CHAT_URL!
export const HUB_CONVERSATIONS_URL = process.env.NEXT_PUBLIC_HUB_CONVERSATIONS_URL!

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
