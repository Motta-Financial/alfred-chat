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
│  Next.js, Vercel (hub.motta.cpa)        │
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
`alfred.motta.cpa` is automatically presented to `hub.motta.cpa` on every
request, and vice versa.

---

## Hybrid data-access boundary

ALFRED runs a deliberate split between data it reads directly from
Supabase (browser → Postgres via the user's anon-key JWT, RLS-enforced)
and data it goes to the Hub for. The rule is: **direct reads only for
ALFRED's own conversation surface and other low-sensitivity, RLS-safe
views; everything privileged goes through the Hub.**

| Concern | Path | Why |
|---|---|---|
| Sign-in / session refresh | Direct Supabase Auth | `@supabase/ssr` |
| List my conversations | **Direct** read of `alfred_conversations` | RLS on `end_user_team_member_id` filters to caller |
| Load messages for a conversation | **Direct** read of `alfred_messages` | RLS rejects others' rows |
| Realtime new-message updates | Direct Supabase Realtime channel | No Hub fan-out needed |
| Send a message / stream AI response | **Hub** `/api/alfred/chat` | Hub owns model, tools, atomic user+assistant write, `ai_usage_log` |
| Karbon / Ignition / Calendly / Zoom / ProConnect / `clients_unified` / `tax_returns` / financial data | **Hub** | Service-role + business rules + audit log |
| Anything that needs `SUPABASE_SERVICE_ROLE_KEY` | **Hub** | Never exposed to the browser |

All direct reads MUST go through `lib/supabase/queries.ts`. Adding a new
table requires a confirmed RLS policy and an entry in this table.

### RLS expectations for direct-read tables

- `alfred_conversations` — `end_user_team_member_id` resolves (via the
  team-member lookup) to the authenticated user's `auth.uid()`. Anon
  callers must be rejected outright (no grants at all).
- `alfred_messages` — `conversation_id` belongs to a conversation owned
  by the authenticated user. Anon callers must be rejected outright.

Smoke-test before deploying any new direct-read table:

```bash
curl -sS "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/<table>?select=id&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# Expect: {"code":"42501", ...} (permission denied — anon has no grants)
```

### Postgres grant matrix (RLS is necessary but NOT sufficient)

RLS only filters rows *after* the role's table privileges pass. In
August 2026 a lockdown pass revoked `SELECT` from `authenticated` on the
`alfred_*` tables (and `EXECUTE` on the RLS helper functions), which
broke every direct read with "permission denied for table
alfred_conversations" even though the RLS policies were intact.
Restored by Supabase migrations `restore_alfred_client_read_access` and
`restore_alfred_rls_helper_execute`. The invariants the thin client
depends on:

| Object | `authenticated` | `anon` |
|---|---|---|
| `alfred_conversations`, `alfred_messages`, `alfred_projects`, `alfred_project_knowledge` | `SELECT, INSERT, UPDATE, DELETE` (RLS scopes rows) | nothing |
| `team_members` | `SELECT` (team-member lookup) | nothing |
| `organizations` | `SELECT` (staff-wide, RLS-gated) | nothing |
| `contacts` | column-level `SELECT` on everything EXCEPT `ssn_encrypted`, `drivers_license`, `passport_number` | nothing |
| Functions `alfred_is_my_team_member(uuid)`, `alfred_caller_is_service_account()`, `alfred_caller_is_team_member()`, `alfred_can_use_project(uuid)` | `EXECUTE` (policies call them) | — |
| Realtime | `alfred_conversations` must be in the `supabase_realtime` publication with `REPLICA IDENTITY FULL` (RLS-checked UPDATE/DELETE events need the old row image) | — |

Verify after any grants/security migration on the shared project:

```sql
begin;
set local role authenticated;
select count(*) from alfred_conversations;  -- 0 rows, but NOT an error
rollback;
```

---

## Environment Variables Required on Vercel (alfred-chat project)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL — same value as Hub |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key — same value as Hub |
| `NEXT_PUBLIC_HUB_CHAT_URL` | `https://hub.motta.cpa/api/alfred/chat` |
| `SUPABASE_COOKIE_DOMAIN` | `.motta.cpa` — scopes cookies written by **server-side** Supabase clients (middleware, server components, /auth/callback) |
| `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN` | `.motta.cpa` — same value, but `NEXT_PUBLIC_`-prefixed so the **browser** Supabase client (`lib/supabase/client.ts`) can read it too. Without this, every client-side token refresh writes a host-only cookie that shadows the shared one, silently breaking SSO durability a few minutes after a successful sign-in. Both vars must be set, and must be byte-identical to whatever the Hub uses. |

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

1. **Health endpoint** — Open `https://hub.motta.cpa/api/alfred/health` in a
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
   `https://hub.motta.cpa/api/alfred/whoami` in the same browser. Should
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
   Open `https://hub.motta.cpa` (Hub) — the same thread created on
   `alfred.motta.cpa` should appear in the Hub's conversation widget.

---

## Projects (Claude Projects-style)

ALFRED mirrors Claude Projects: conversations can be grouped into projects
that carry **custom instructions** and **knowledge** (pasted text or
snapshots of Hub clients) applied to every chat in the project.

### Schema (Supabase, applied via migration `alfred_projects_feature`)

- `alfred_projects` — id, owner_team_member_id → team_members, name,
  description, instructions, visibility ('private' | 'team'), audience,
  is_archived, timestamps.
- `alfred_project_knowledge` — id, project_id → alfred_projects (cascade),
  title, content (text injected into the system prompt), source_type
  ('manual' | 'hub_client' | 'hub_document'), source_ref (e.g.
  `organizations:<uuid>`), created_by_team_member_id, timestamps.
- `alfred_conversations.project_id` — nullable FK → alfred_projects
  (ON DELETE SET NULL: deleting a project keeps chat history).

### RLS

Same ownership model as alfred_conversations
(`alfred_is_my_team_member(owner_team_member_id)` OR
`alfred_caller_is_service_account()`), plus:

- `visibility = 'team'` rows are **readable** (not writable) by any active
  team member via the new `alfred_caller_is_team_member()` helper.
- Knowledge rows inherit access from their parent project; mutations are
  owner-only.

The thin client writes projects/knowledge directly (user-authored rows,
RLS-scoped) per rule 3 of `lib/supabase/queries.ts`.

### Chat request contract (Hub work required)

The client now sends an optional `projectId` in the POST /api/alfred/chat
body. The Hub should:

1. Load the project (service role) and verify the caller can access it
   (owner, or `visibility='team'`).
2. Prepend `alfred_projects.instructions` and all
   `alfred_project_knowledge.content` rows to the system prompt.
3. Set `project_id` on the conversation row it creates. (Until then, the
   client files new conversations under the project itself after the
   `data-conversation` event — owner-scoped RLS update.)

### Model catalog (Hub work required)

`GET /api/alfred/models` (Bearer auth, CORS same as other alfred routes):

```json
{
  "models": [
    { "id": "anthropic/claude-sonnet-4.6", "label": "Claude Sonnet 4.6",
      "provider": "Anthropic", "hint": "Balanced default" }
  ],
  "default": "anthropic/claude-sonnet-4.6"
}
```

Should list every model the firm exposes through the Vercel AI Gateway.
The client falls back to its static Claude list when the endpoint is
missing, and `POST /chat` must accept any id this endpoint returns.

### "Auto" model (client-side only)

The picker's default entry, **Auto** (`id: "auto"`), is virtual and
never reaches the Hub — `POST /chat` continues to receive only concrete
gateway ids. `routeAutoModel()` in `lib/models.ts` resolves it per
prompt right before each send: light tier (Haiku/mini) for short plain
lookups, heavy tier (Opus) for explicit analysis/research prompts or
Deep think on a complex prompt, balanced tier (Sonnet) otherwise. The
tiers are discovered from the live catalog by id substring
(`haiku`/`mini`, `sonnet`, `opus`), so the Hub can rotate model versions
without a client change. No Hub work required.
