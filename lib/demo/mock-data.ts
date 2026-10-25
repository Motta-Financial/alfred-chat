/**
 * Self-contained demo data for ALFRED Ai. Everything here is fictional.
 * Nothing in the app talks to a database or any external service.
 */

export const FIRM_NAME = "Brightwater CPA"
export const STAFF_USER = "Jordan Ellis"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface DemoMessage {
  id: string
  role: "user" | "assistant"
  text: string
}

export interface ConversationRow {
  id: string
  title: string | null
  project_id: string | null
  updated_at: string
  created_at: string
}

export interface ProjectRow {
  id: string
  name: string
  description: string | null
  instructions: string | null
  visibility: "private" | "team"
  updated_at: string
  created_at: string
}

export interface KnowledgeRow {
  id: string
  project_id: string
  title: string
  content: string
  source_type: "manual" | "client"
  created_at: string
}

export interface MockClient {
  id: string
  kind: "organization" | "contact"
  name: string
  detail: string
  summary: string
}

/* ------------------------------------------------------------------ */
/* Clients                                                             */
/* ------------------------------------------------------------------ */

export const MOCK_CLIENTS: MockClient[] = [
  {
    id: "client-hartwell",
    kind: "contact",
    name: "Hartwell Family",
    detail: "Household · Individual returns",
    summary:
      "Married filing jointly, two dependents. 2025 return was filed on extension and accepted by the IRS and the state ahead of the Oct 15 deadline.",
  },
  {
    id: "client-lakeside",
    kind: "organization",
    name: "Lakeside Bakery",
    detail: "Retail bakery · S corporation",
    summary:
      "S corporation with 9 employees. Monthly bookkeeping, quarterly sales tax filings and annual business return. Three open items as of late October.",
  },
  {
    id: "client-rivera",
    kind: "organization",
    name: "Rivera Dental",
    detail: "Dental practice · Advisory client",
    summary:
      "Single-location dental practice led by Dr. Elena Rivera. Exploring a second office in 2027 and a year-end equipment purchase.",
  },
  {
    id: "client-northgate",
    kind: "organization",
    name: "Northgate Design Studio",
    detail: "Design studio · Prospect",
    summary:
      "Three-partner design studio evaluating a bookkeeping and advisory engagement. Proposal sent Oct 2 and not yet signed.",
  },
  {
    id: "client-okafor",
    kind: "contact",
    name: "Samuel Okafor",
    detail: "Individual · Self-employed consultant",
    summary:
      "Independent consultant with 1099 income and quarterly estimated payments. Home office deduction under review.",
  },
]

export function searchMockClients(term: string): MockClient[] {
  const q = term.trim().toLowerCase()
  if (!q) return []
  return MOCK_CLIENTS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.detail.toLowerCase().includes(q),
  )
}

export function buildClientKnowledge(client: MockClient): { title: string; content: string } {
  return {
    title: client.name,
    content: `${client.name} — ${client.detail}. ${client.summary}`,
  }
}

/* ------------------------------------------------------------------ */
/* Scripted replies                                                    */
/* ------------------------------------------------------------------ */

export const DEMO_QUESTIONS = [
  "Where does the Hartwell family's 2025 tax return stand?",
  "What work is still open for Lakeside Bakery?",
  "What did we discuss with Rivera Dental in last week's meeting?",
] as const

const HARTWELL_REPLY = `The Hartwell family's 2025 individual return was **e-filed and accepted**.

- **Federal:** accepted by the IRS on Oct 13, 2026
- **State:** accepted on Oct 14, 2026
- **Filing:** filed on extension, ahead of the Oct 15 deadline
- **Team:** Preparer: Jordan Ellis · Reviewer: Priya Nair

Nothing else is outstanding on this return.`

const LAKESIDE_REPLY = `Lakeside Bakery has **3 open items**:

- **Q3 2026 sales tax filing:** In progress, due Oct 31 · Assigned to Maya Chen
- **October bookkeeping:** Not started, due Nov 15 · Assigned to Maya Chen
- **2027 tax planning meeting:** Scheduled for Nov 6 · With Priya Nair

The sales tax filing is the most time-sensitive.`

const RIVERA_REPLY = `From the **Oct 20, 2026 Zoom meeting** with Dr. Elena Rivera (30 minutes):

- Plans to open a second office location in 2027
- Questions about whether to change the business's entity structure before expanding
- Timing of a new equipment purchase before year-end

**Action items:**

- Priya Nair to send a 2027 cash flow projection by Nov 3
- Dr. Rivera to send the equipment quote`

const NORTHGATE_REPLY = `The proposal to **Northgate Design Studio** was sent on Oct 2. They have viewed it twice (Oct 3 and Oct 9) but it is **not yet signed**.

**Suggested follow-up:** send a short note this week offering a 15-minute call to walk through the bookkeeping scope. The last view was on the pricing page, so lead with the fixed monthly fee.`

const OKAFOR_REPLY = `**Samuel Okafor** is a self-employed consultant with 1099 income and quarterly estimated payments.

| Item | Status |
| --- | --- |
| Q3 estimated payment confirmation | Missing (requested Oct 12) |
| Home office deduction | Under review |
| Estimated tax planning meeting | Friday, 9:00 AM |

**Suggested next step:** ask Samuel for the Q3 payment confirmation ahead of Friday's planning meeting.`

const FALLBACK_REPLY = `I'm happy to help. Since this is a demo with fictional data, here are a few things you can ask me:

- "Where does the Hartwell family's 2025 tax return stand?"
- "What work is still open for Lakeside Bakery?"
- "What did we discuss with Rivera Dental in last week's meeting?"`

type ClientKey = "hartwell" | "lakeside" | "rivera" | "northgate" | "okafor"

const CLIENT_PATTERNS: Array<[ClientKey, RegExp]> = [
  ["northgate", /\bnorthgate\b/],
  ["lakeside", /\blakeside\b/],
  ["hartwell", /\bhartwell\b/],
  ["rivera", /\brivera\b/],
  ["okafor", /\bokafor\b/],
]

function findClient(text: string): ClientKey | null {
  for (const [key, pattern] of CLIENT_PATTERNS) {
    if (pattern.test(text)) return key
  }
  return null
}

function replyForClient(client: ClientKey): string {
  switch (client) {
    case "hartwell":
      return HARTWELL_REPLY
    case "lakeside":
      return LAKESIDE_REPLY
    case "rivera":
      return RIVERA_REPLY
    case "northgate":
      return NORTHGATE_REPLY
    case "okafor":
      return OKAFOR_REPLY
  }
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim()

/** Exact demo questions get their scripted answers; anything else matches on client name. */
export function getScriptedReply(message: string): string {
  const text = normalize(message)

  const exact = DEMO_QUESTIONS.findIndex((q) => normalize(q) === text)
  if (exact === 0) return HARTWELL_REPLY
  if (exact === 1) return LAKESIDE_REPLY
  if (exact === 2) return RIVERA_REPLY

  const client = findClient(text)
  if (client) return replyForClient(client)

  return FALLBACK_REPLY
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

export const MOCK_PROJECTS: ProjectRow[] = [
  {
    id: "project-tax-season",
    name: "2025 Tax Season",
    description: "Individual and business returns in preparation or review.",
    instructions:
      "You are helping the Brightwater CPA tax team during the 2025 filing season. Always name the reviewer and the due date. Flag any missing source documents.",
    visibility: "team",
    created_at: ago(40 * DAY),
    updated_at: ago(1 * DAY),
  },
  {
    id: "project-onboarding",
    name: "New Client Onboarding",
    description: "Prospects and new clients moving through intake.",
    instructions:
      "Keep a friendly, professional tone. Track proposal status, engagement letters and the documents each new client still owes us.",
    visibility: "team",
    created_at: ago(20 * DAY),
    updated_at: ago(2 * DAY),
  },
]

export const MOCK_KNOWLEDGE: Record<string, KnowledgeRow[]> = {
  "project-tax-season": ["client-hartwell", "client-lakeside", "client-okafor"].map((id) =>
    clientKnowledgeRow("project-tax-season", id),
  ),
  "project-onboarding": ["client-northgate", "client-rivera"].map((id) =>
    clientKnowledgeRow("project-onboarding", id),
  ),
}

function clientKnowledgeRow(projectId: string, clientId: string): KnowledgeRow {
  const client = MOCK_CLIENTS.find((c) => c.id === clientId)!
  const { title, content } = buildClientKnowledge(client)
  return {
    id: `${projectId}:${clientId}`,
    project_id: projectId,
    title,
    content,
    source_type: "client",
    created_at: ago(10 * DAY),
  }
}

/* ------------------------------------------------------------------ */
/* Conversations                                                       */
/* ------------------------------------------------------------------ */

export const MOCK_CONVERSATIONS: ConversationRow[] = [
  {
    id: "conv-northgate",
    title: "Northgate proposal status",
    project_id: "project-onboarding",
    created_at: ago(3 * HOUR),
    updated_at: ago(3 * HOUR),
  },
  {
    id: "conv-meetings",
    title: "Meetings this week",
    project_id: null,
    created_at: ago(1 * DAY),
    updated_at: ago(1 * DAY),
  },
  {
    id: "conv-missing-docs",
    title: "Missing documents follow-up",
    project_id: "project-tax-season",
    created_at: ago(2 * DAY),
    updated_at: ago(2 * DAY),
  },
  {
    id: "conv-okafor",
    title: "Okafor estimated payments",
    project_id: "project-tax-season",
    created_at: ago(4 * DAY),
    updated_at: ago(4 * DAY),
  },
]

export const MOCK_MESSAGES: Record<string, DemoMessage[]> = {
  "conv-northgate": [
    { id: "ng-1", role: "user", text: "Where are we with the Northgate proposal?" },
    { id: "ng-2", role: "assistant", text: NORTHGATE_REPLY },
  ],
  "conv-meetings": [
    { id: "meet-1", role: "user", text: "What meetings do I have this week?" },
    {
      id: "meet-2",
      role: "assistant",
      text: `You have three meetings this week:

| Day | Time | Client | Topic |
| --- | --- | --- | --- |
| Tue | 2:00 PM | Lakeside Bakery | Sales tax filing check-in |
| Thu | 11:30 AM | Northgate Design Studio | Proposal walkthrough |
| Fri | 9:00 AM | Samuel Okafor | Estimated tax planning |`,
    },
  ],
  "conv-missing-docs": [
    {
      id: "docs-1",
      role: "user",
      text: "Which clients still owe us documents? Draft a short follow-up.",
    },
    {
      id: "docs-2",
      role: "assistant",
      text: `One client has outstanding documents:

| Client | Missing | Requested |
| --- | --- | --- |
| Samuel Okafor | Q3 estimated payment confirmation | Oct 12 |

Here is a draft you can adapt:

> Hi, a quick reminder that we are still waiting on the item listed above so we can keep your planning on track. You can upload it in the portal or reply to this email. Thank you!`,
    },
  ],
  "conv-okafor": [
    { id: "ok-1", role: "user", text: "Give me a summary for Samuel Okafor." },
    { id: "ok-2", role: "assistant", text: OKAFOR_REPLY },
  ],
}
