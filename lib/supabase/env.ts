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

/**
 * Prefer the current-generation publishable key; fall back to the legacy
 * anon key.
 *
 * The legacy `anon` key is a JWT signed by the project's legacy JWT secret.
 * Invalidating a leaked `service_role` key requires disabling legacy API
 * keys in Supabase, and that kills the anon key at the same time — so while
 * anything still reads it, a compromised privileged key cannot be revoked.
 *
 * The Hub made the same change (Motta-Financial/v0-motta-hub#374). Both
 * apps had to move before legacy keys could be switched off; this one was
 * the last dependency.
 *
 * Both keys are browser-safe — neither carries privileges beyond what RLS
 * allows — so this is a like-for-like swap.
 *
 * The export keeps its old name so the four call sites are untouched. It is
 * now a slight misnomer; renaming it is a worthwhile follow-up, but not
 * while the point of the change is to avoid breaking anything.
 *
 * NOTE: `process.env.NEXT_PUBLIC_*` is substituted at build time, so every
 * name must appear literally here. A dynamic lookup resolves to undefined
 * in the browser.
 */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_ALFRED_STORAGE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_ALFRED_STORAGE_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surface a clear runtime error instead of letting @supabase/ssr throw a
  // cryptic "Invalid URL" deep in the call stack.
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_ALFRED_STORAGE_SUPABASE_URL / _PUBLISHABLE_KEY (or the anon-key and un-prefixed fallbacks).",
  )
}
