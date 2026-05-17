/**
 * Whitelisted direct-Supabase reads for ALFRED chat.
 *
 * RULES — read carefully before adding anything here.
 *
 * 1. Every query in this file MUST be safe to expose to the
 *    authenticated end user. The only credential available is
 *    their anon-key session JWT; RLS policies on the table are
 *    the security boundary.
 *
 * 2. Never import or use SUPABASE_SERVICE_ROLE_KEY (or the
 *    ALFRED_STORAGE_SUPABASE_SERVICE_ROLE_KEY alias) from this
 *    repo. Privileged work happens in v0-motta-hub.
 *
 * 3. Writes (especially anything that touches AI/billing/PII)
 *    go through the Hub. The only writes allowed here are
 *    user-authored rows where RLS enforces auth.uid() ownership.
 *
 * 4. Adding a new table to this file requires:
 *    - A confirmed RLS policy that scopes rows to the caller.
 *    - A note in INTEGRATION.md describing the policy.
 */

import type { UIMessage } from "ai"

import { createClient } from "@/lib/supabase/client"

export interface ConversationRow {
  id: string
  title: string | null
  audience: string | null
  updated_at: string
  created_at: string
}

interface AlfredMessageRow {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  // alfred_messages.content is JSONB shaped { parts: [{ type, text }] }
  // matching AI SDK UIMessage parts. Older rows may be a plain string.
  content:
    | string
    | {
        parts?: Array<{ type: string; text?: string }>
      }
  created_at: string
}

/**
 * List the current user's Alfred conversations, newest first.
 * RLS filters to rows where end_user_team_member_id resolves to the caller.
 */
export async function listMyConversations(): Promise<ConversationRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("alfred_conversations")
    .select("id, title, audience, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(`Failed to list conversations: ${error.message}`)
  }
  return (data ?? []) as ConversationRow[]
}

/**
 * Load all messages for a single conversation, oldest first, mapped to
 * AI SDK UIMessage shape so the chat surface can hydrate them directly.
 * RLS rejects rows the caller does not own.
 */
export async function listMessages(conversationId: string): Promise<UIMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("alfred_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`)
  }

  return (data ?? []).map((row) => toUIMessage(row as AlfredMessageRow))
}

/**
 * Subscribe to live updates for the current user's conversations
 * (insert / update / delete on alfred_conversations). Returns an
 * unsubscribe function.
 */
export function subscribeToConversations(onChange: () => void): () => void {
  const supabase = createClient()
  const channel = supabase
    .channel("alfred_conversations_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "alfred_conversations" },
      () => onChange(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

function toUIMessage(row: AlfredMessageRow): UIMessage {
  const parts = extractParts(row.content)
  const text = parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("")

  // Only user/assistant render in the chat surface. Tool/system rows
  // get coerced to assistant so nothing is lost if they leak through.
  const role: UIMessage["role"] = row.role === "user" ? "user" : "assistant"

  return {
    id: row.id,
    role,
    parts: parts as UIMessage["parts"],
    // `content` and `createdAt` are not in the v6 UIMessage type but
    // some older code paths still read them. Cast keeps both happy.
    ...({ content: text, createdAt: new Date(row.created_at) } as Record<string, unknown>),
  } as UIMessage
}

function extractParts(
  content: AlfredMessageRow["content"],
): Array<{ type: string; text?: string }> {
  if (typeof content === "string") {
    return [{ type: "text", text: content }]
  }
  if (content && Array.isArray(content.parts)) {
    return content.parts
  }
  return []
}
