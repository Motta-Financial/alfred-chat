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
  project_id: string | null
  updated_at: string
  created_at: string
}

export interface ProjectRow {
  id: string
  owner_team_member_id: string
  name: string
  description: string | null
  instructions: string | null
  visibility: "private" | "team"
  is_archived: boolean
  updated_at: string
  created_at: string
}

export interface KnowledgeRow {
  id: string
  project_id: string
  title: string
  content: string
  source_type: "manual" | "hub_client" | "hub_document"
  source_ref: string | null
  updated_at: string
  created_at: string
}

export interface HubClientHit {
  id: string
  kind: "organization" | "contact"
  name: string
  detail: string | null
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
    .select("id, title, audience, project_id, updated_at, created_at")
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

/* ------------------------------------------------------------------ */
/* Projects (alfred_projects)                                          */
/*                                                                     */
/* RLS: owner (via alfred_is_my_team_member on owner_team_member_id)   */
/* has full CRUD; visibility='team' rows are readable by any active    */
/* team member; the Hub service account passes everything. Documented  */
/* in INTEGRATION.md.                                                  */
/* ------------------------------------------------------------------ */

let cachedTeamMemberId: string | null = null

/**
 * Resolve the caller's team_members.id (the ownership key used across
 * every alfred_* table). Cached for the session — the mapping never
 * changes while a user is signed in.
 */
export async function getMyTeamMemberId(): Promise<string> {
  if (cachedTeamMemberId) return cachedTeamMemberId
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("No active Supabase session")
  }

  const { data, error } = await supabase
    .from("team_members")
    .select("id")
    .eq("auth_user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    throw new Error(
      "Your Hub account is not linked to a team member record. Ask an admin to link it on the Motta Hub.",
    )
  }
  cachedTeamMemberId = data.id as string
  return cachedTeamMemberId
}

/** List projects visible to the caller (own + team-shared), active first. */
export async function listMyProjects(): Promise<ProjectRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("alfred_projects")
    .select(
      "id, owner_team_member_id, name, description, instructions, visibility, is_archived, updated_at, created_at",
    )
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`)
  }
  return (data ?? []) as ProjectRow[]
}

export interface ProjectInput {
  name: string
  description?: string | null
  instructions?: string | null
  visibility?: "private" | "team"
}

export async function createProject(input: ProjectInput): Promise<ProjectRow> {
  const supabase = createClient()
  const ownerId = await getMyTeamMemberId()
  const { data, error } = await supabase
    .from("alfred_projects")
    .insert({
      owner_team_member_id: ownerId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      instructions: input.instructions?.trim() || null,
      visibility: input.visibility ?? "private",
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`)
  }
  return data as ProjectRow
}

export async function updateProject(
  id: string,
  patch: Partial<ProjectInput> & { is_archived?: boolean },
): Promise<ProjectRow> {
  const supabase = createClient()
  const update: Record<string, unknown> = {}
  if (patch.name !== undefined) update.name = patch.name.trim()
  if (patch.description !== undefined) update.description = patch.description?.trim() || null
  if (patch.instructions !== undefined) update.instructions = patch.instructions?.trim() || null
  if (patch.visibility !== undefined) update.visibility = patch.visibility
  if (patch.is_archived !== undefined) update.is_archived = patch.is_archived

  const { data, error } = await supabase
    .from("alfred_projects")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`)
  }
  return data as ProjectRow
}

/**
 * Delete a project. Conversations keep their history (project_id is set
 * NULL by the FK); knowledge rows cascade away with the project.
 */
export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("alfred_projects").delete().eq("id", id)
  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`)
  }
}

/** Move a conversation into a project (or out, with projectId = null). */
export async function assignConversationToProject(
  conversationId: string,
  projectId: string | null,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("alfred_conversations")
    .update({ project_id: projectId })
    .eq("id", conversationId)
  if (error) {
    throw new Error(`Failed to move conversation: ${error.message}`)
  }
}

/* ------------------------------------------------------------------ */
/* Project knowledge (alfred_project_knowledge)                        */
/* ------------------------------------------------------------------ */

export async function listProjectKnowledge(projectId: string): Promise<KnowledgeRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("alfred_project_knowledge")
    .select("id, project_id, title, content, source_type, source_ref, updated_at, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to load project knowledge: ${error.message}`)
  }
  return (data ?? []) as KnowledgeRow[]
}

export async function addKnowledge(input: {
  projectId: string
  title: string
  content: string
  sourceType?: KnowledgeRow["source_type"]
  sourceRef?: string | null
}): Promise<KnowledgeRow> {
  const supabase = createClient()
  const creatorId = await getMyTeamMemberId()
  const { data, error } = await supabase
    .from("alfred_project_knowledge")
    .insert({
      project_id: input.projectId,
      title: input.title.trim(),
      content: input.content,
      source_type: input.sourceType ?? "manual",
      source_ref: input.sourceRef ?? null,
      created_by_team_member_id: creatorId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add knowledge: ${error.message}`)
  }
  return data as KnowledgeRow
}

export async function deleteKnowledge(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("alfred_project_knowledge").delete().eq("id", id)
  if (error) {
    throw new Error(`Failed to remove knowledge: ${error.message}`)
  }
}

/* ------------------------------------------------------------------ */
/* Hub client lookup (organizations / contacts are firm-wide readable) */
/* ------------------------------------------------------------------ */

/**
 * Search Hub clients by name so a project can attach client context as
 * knowledge. Read-only; both tables are firm-wide readable to
 * authenticated staff.
 */
export async function searchHubClients(term: string): Promise<HubClientHit[]> {
  const q = term.trim()
  if (q.length < 2) return []
  const supabase = createClient()
  const pattern = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`

  const [orgs, contacts] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, entity_type, industry")
      .ilike("name", pattern)
      .limit(6),
    supabase
      .from("contacts")
      .select("id, full_name, primary_email")
      .ilike("full_name", pattern)
      .limit(6),
  ])

  if (orgs.error) throw new Error(`Failed to search organizations: ${orgs.error.message}`)
  if (contacts.error) throw new Error(`Failed to search contacts: ${contacts.error.message}`)

  const hits: HubClientHit[] = []
  for (const row of orgs.data ?? []) {
    hits.push({
      id: row.id as string,
      kind: "organization",
      name: (row.name as string) ?? "Unnamed organization",
      detail: [row.entity_type, row.industry].filter(Boolean).join(" · ") || null,
    })
  }
  for (const row of contacts.data ?? []) {
    hits.push({
      id: row.id as string,
      kind: "contact",
      name: (row.full_name as string) ?? "Unnamed contact",
      detail: (row.primary_email as string) ?? null,
    })
  }
  return hits
}

/**
 * Build a knowledge snapshot for a Hub client. Pulls the row and renders
 * a compact text profile the Hub injects into the system prompt.
 */
export async function buildClientKnowledge(hit: HubClientHit): Promise<{ title: string; content: string; sourceRef: string }> {
  const supabase = createClient()
  if (hit.kind === "organization") {
    const { data, error } = await supabase
      .from("organizations")
      .select(
        "name, legal_name, entity_type, industry, line_of_business, primary_email, phone, website, city, state, fiscal_year_end_month, annual_revenue",
      )
      .eq("id", hit.id)
      .single()
    if (error || !data) throw new Error("Could not load that organization.")
    const lines = [
      `Client organization: ${data.name ?? hit.name}`,
      data.legal_name && data.legal_name !== data.name ? `Legal name: ${data.legal_name}` : null,
      data.entity_type ? `Entity type: ${data.entity_type}` : null,
      data.industry ? `Industry: ${data.industry}` : null,
      data.line_of_business ? `Line of business: ${data.line_of_business}` : null,
      data.primary_email ? `Email: ${data.primary_email}` : null,
      data.phone ? `Phone: ${data.phone}` : null,
      data.website ? `Website: ${data.website}` : null,
      data.city || data.state ? `Location: ${[data.city, data.state].filter(Boolean).join(", ")}` : null,
      data.fiscal_year_end_month ? `Fiscal year end month: ${data.fiscal_year_end_month}` : null,
      data.annual_revenue ? `Annual revenue: ${data.annual_revenue}` : null,
    ].filter(Boolean)
    return {
      title: `Hub client: ${data.name ?? hit.name}`,
      content: lines.join("\n"),
      sourceRef: `organizations:${hit.id}`,
    }
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("full_name, primary_email, phone_primary, contact_type, city, state")
    .eq("id", hit.id)
    .single()
  if (error || !data) throw new Error("Could not load that contact.")
  const lines = [
    `Client contact: ${data.full_name ?? hit.name}`,
    data.contact_type ? `Type: ${data.contact_type}` : null,
    data.primary_email ? `Email: ${data.primary_email}` : null,
    data.phone_primary ? `Phone: ${data.phone_primary}` : null,
    data.city || data.state ? `Location: ${[data.city, data.state].filter(Boolean).join(", ")}` : null,
  ].filter(Boolean)
  return {
    title: `Hub client: ${data.full_name ?? hit.name}`,
    content: lines.join("\n"),
    sourceRef: `contacts:${hit.id}`,
  }
}
