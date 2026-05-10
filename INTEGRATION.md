# ALFRED Chat — Integration Notes

## Architecture

```
Browser
  │
  │  HTTPS (alfred.motta.cpa)
  ▼
┌─────────────────────────────────────────┐
│  alfred-chat  (this repo)               │
│  Next.js 15, Vercel                     │
│                                         │
│  /login         Magic-link OTP form     │
│  /auth/callback Code → session exchange │
│  /              Chat UI + sidebar       │
│                                         │
│  Auth: @supabase/ssr (shared project)   │
│  Sends: Authorization: Bearer <token>   │
└──────────────┬──────────────────────────┘
               │ fetch() from browser
               │ Bearer token
               ▼
┌─────────────────────────────────────────┐
│  v0-motta-hub  (separate repo)          │
│  Next.js, Vercel (app.motta.cpa)        │
│                                         │
│  POST /api/alfred/chat      AI stream   │
│  GET  /api/alfred/conversations         │
│  GET  /api/alfred/conversations/{id}    │
│  GET  /api/alfred/health                │
│  GET  /api/alfred/whoami                │
│                                         │
│  Owns: system prompt, tools, model,     │
│        Supabase data reads/writes       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Supabase (shared project)              │
│  Auth only on alfred-chat side          │
│  Auth + data on hub side                │
└─────────────────────────────────────────┘
```

Auth cookies are set with `domain: .motta.cpa` so a session obtained on
`alfred.motta.cpa` is automatically presented to `app.motta.cpa` on every
request, and vice versa.

---

## Environment Variables Required on Vercel (alfred-chat project)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL — same value as Hub |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key — same value as Hub |
| `NEXT_PUBLIC_HUB_CHAT_URL` | `https://app.motta.cpa/api/alfred/chat` |
| `NEXT_PUBLIC_HUB_CONVERSATIONS_URL` | `https://app.motta.cpa/api/alfred/conversations` |
| `SUPABASE_COOKIE_DOMAIN` | `.motta.cpa` (note the leading dot) |

---

## DNS & Infrastructure the Human Must Configure

1. **DNS** — `alfred.motta.cpa` CNAME → `cname.vercel-dns.com` (or the alias
   your Vercel project uses). Add the domain in the Vercel project settings.

2. **Vercel domain** — In the `alfred-chat` Vercel project add `alfred.motta.cpa`
   as a custom domain and let Vercel provision the TLS cert.

3. **Supabase Auth redirect URLs** — In your Supabase project dashboard
   → Authentication → URL Configuration, add:
   - `https://alfred.motta.cpa/auth/callback`
   - `http://localhost:3000/auth/callback` (local dev)

4. **Supabase cookie domain** — No Supabase config needed here; the cookie
   `domain` is set in middleware/server.ts via the `SUPABASE_COOKIE_DOMAIN`
   env var. Supabase itself doesn't care about cookie domains.

5. **Hub CORS** — Ensure `v0-motta-hub`'s Next.js config or middleware allows
   `Origin: https://alfred.motta.cpa` for `/api/alfred/*` routes. Without this,
   browser fetch calls will be blocked.

6. **Logo asset** — Copy the real logo before deploying:
   ```bash
   cp ../v0-motta-hub/public/images/alfred-logo.png public/images/alfred-logo.png
   ```
   Or set an env var and update the `src` in `LogoImage.tsx` to point to a CDN.

---

## Manual Verification Checklist

Run through these steps after deploying both repos to production:

1. **Health endpoint** — Open `https://app.motta.cpa/api/alfred/health` in a
   browser. Should return HTTP 200 with a JSON body. The green dot in the
   ALFRED header also confirms this.

2. **Login flow** — Navigate to `https://alfred.motta.cpa`. Should redirect to
   `/login`. Enter a `@mottafinancial.com` or `@motta.cpa` email. Should see
   "Magic link sent" toast. An email with a link should arrive within ~60 s.

3. **Domain enforcement** — Enter an email from a non-allowed domain (e.g.
   `test@gmail.com`). Should see the toast "Access restricted to …" and the
   link should NOT be sent.

4. **Auth callback** — Click the magic link in the email. Should land on
   `https://alfred.motta.cpa/auth/callback?code=...` and redirect to `/`.
   Browser DevTools → Application → Cookies should show `sb-*-auth-token`
   cookies scoped to `.motta.cpa`.

5. **Cross-subdomain cookie** — After step 4, open
   `https://app.motta.cpa/api/alfred/whoami` in the same browser. Should
   return HTTP 200 with your user details (not 401). This confirms the shared
   cookie domain is working.

6. **Chat message** — On `https://alfred.motta.cpa`, type a message and send.
   Should stream a response from ALFRED within a few seconds with no 401/403
   errors in the browser Network tab.

7. **Conversation persisted in sidebar** — After the first message, the left
   sidebar should show a new entry. The Hub emits a `data-conversation` part
   which the thin client uses to track the ID.

8. **Thread round-trip** — Click a conversation in the sidebar. The chat
   should hydrate with the historical messages. Send a follow-up message.
   Open `https://app.motta.cpa` (Hub) — the same thread created on
   `alfred.motta.cpa` should appear in the Hub's conversation widget.
