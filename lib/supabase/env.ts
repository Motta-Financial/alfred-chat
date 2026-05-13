/**
 * Centralized Supabase env-var access.
 *
 * The authoritative Supabase project (shared with the Motta Hub) is exposed
 * under the `ALFRED_STORAGE_*` prefix by the Vercel Supabase integration.
 * Falls back to the un-prefixed names so local `.env.local` files still work.
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_ALFRED_STORAGE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ""

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_ALFRED_STORAGE_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surface a clear runtime error instead of letting @supabase/ssr throw a
  // cryptic "Invalid URL" deep in the call stack.
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_ALFRED_STORAGE_SUPABASE_URL / _ANON_KEY (or the un-prefixed fallback).",
  )
}
