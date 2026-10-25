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
    id: "client-chen",
    kind: "contact",
    name: "Chen Family",
    detail: "Household · Individual returns",
    summary:
      "Married filing jointly, two dependents. W-2 income from both spouses plus brokerage interest and dividends. 2025 return is in review with Sam Patel.",
  },
  {
    id: "client-harlow",
    kind: "organization",
    name: "Harlow Bakery LLC",
    detail: "Retail bakery · S corporation",
    summary:
      "S corporation with 9 employees. Monthly bookkeeping, quarterly payroll review and annual business return. Owner: Dana Harlow.",
  },
  {
    id: "client-ortiz",
    kind: "organization",
    name: "Ortiz & Partners Design",
    detail: "Design studio · Prospect",
    summary:
      "Three-partner design studio evaluating a bookkeeping and advisory engagement. Proposal sent Oct 2 and not yet signed.",
  },
  {
    id: "client-maple",
    kind: "organization",
    name: "Maple Street Dental PC",
    detail: "Dental practice · New client",
    summary:
      "Single-location dental practice onboarding in October. Needs prior-year returns, payroll access and a chart of accounts review.",
  },
  {
    id: "client-priya",
    kind: "contact",
    name: "Priya Nair",
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

const CHEN_REPLY = `The Chen Family's 2025 return is **in review**. Still missing: 1099-INT and 1098-T. Reviewer: Sam Patel. Due: April 15.

| Document | Status |
| --- | --- |
| W-2 (Wei Chen) | Received |
| W-2 (Lily Chen) | Received |
| 1099-DIV | Received |
| 1098 Mortgage interest | Received |
| 1099-INT | Missing |
| 1098-T | Missing |`

const OPEN_WORK_REPLY = `Here is the open work for **Harlow Bakery LLC**:

| Work item | Status | Owner | Due |
| --- | --- | --- | --- |
| Monthly bookkeeping (Oct) | In progress | Maya Reyes | Nov 10 |
| Q3 payroll review | In review | Sam Patel | Oct 31 |
| 2025 business return | Not started | Jordan Ellis | Mar 16 |`

const MEETING_REPLY = `From your Oct 14 meeting with Harlow Bakery:

- Dana plans to add a second location in the spring and wants to model the cash impact first.
- Weekend overtime ran about 18% above budget in Q3, which is driving the payroll review.
- They are open to moving from monthly to weekly bookkeeping during the holiday rush.

**Next steps**

1. Send Dana a cash-flow scenario for the second location.
2. Share the Q3 payroll review findings by Oct 31.`

const PROPOSAL_REPLY = `The proposal to **Ortiz & Partners Design** was sent on Oct 2. They have viewed it twice (Oct 3 and Oct 9) but it is **not yet signed**.

**Suggested follow-up:** send a short note this week offering a 15-minute call to walk through the bookkeeping scope. The last view was on the pricing page, so lead with the fixed monthly fee.`

const FALLBACK_REPLY = `I'm happy to help. Since this is a demo with fictional data, here are a few things you can ask me:

- "What's the status of the Chen Family return?"
- "What open work do we have for Harlow Bakery?"
- "Summarize my last meeting with Harlow Bakery"
- "Where is the Ortiz proposal?"`

/** Pick a scripted answer from keywords in the user's message. */
export function getScriptedReply(message: string): string {
  const text = message.toLowerCase()
  if (text.includes("proposal") || text.includes("ortiz")) return PROPOSAL_REPLY
  if (text.includes("meeting") || text.includes("summarize")) return MEETING_REPLY
  if (text.includes("status") || text.includes("chen")) return CHEN_REPLY
  if (text.includes("open") || text.includes("harlow")) return OPEN_WORK_REPLY
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
  "project-tax-season": ["client-chen", "client-harlow", "client-priya"].map((id) =>
    clientKnowledgeRow("project-tax-season", id),
  ),
  "project-onboarding": ["client-ortiz", "client-maple"].map((id) =>
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
    id: "conv-chen",
    title: "Return status – Chen Family",
    project_id: "project-tax-season",
    created_at: ago(2 * HOUR),
    updated_at: ago(2 * HOUR),
  },
  {
    id: "conv-harlow",
    title: "Open work for Harlow Bakery",
    project_id: "project-tax-season",
    created_at: ago(5 * HOUR),
    updated_at: ago(5 * HOUR),
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
    id: "conv-ortiz",
    title: "Ortiz proposal status",
    project_id: "project-onboarding",
    created_at: ago(4 * DAY),
    updated_at: ago(4 * DAY),
  },
  {
    id: "conv-payroll",
    title: "Q3 payroll review",
    project_id: null,
    created_at: ago(6 * DAY),
    updated_at: ago(6 * DAY),
  },
]

export const MOCK_MESSAGES: Record<string, DemoMessage[]> = {
  "conv-chen": [
    { id: "chen-1", role: "user", text: "What's the status of the Chen Family's 2025 return?" },
    { id: "chen-2", role: "assistant", text: CHEN_REPLY },
    { id: "chen-3", role: "user", text: "Can you remind me who is reviewing it?" },
    {
      id: "chen-4",
      role: "assistant",
      text: "Sam Patel is the reviewer. The return is due April 15, and it can move to e-file approval as soon as the 1099-INT and 1098-T arrive.",
    },
  ],
  "conv-harlow": [
    { id: "harlow-1", role: "user", text: "What open work do we have for Harlow Bakery?" },
    { id: "harlow-2", role: "assistant", text: OPEN_WORK_REPLY },
  ],
  "conv-meetings": [
    { id: "meet-1", role: "user", text: "What meetings do I have this week?" },
    {
      id: "meet-2",
      role: "assistant",
      text: `You have four meetings this week:

| Day | Time | Client | Topic |
| --- | --- | --- | --- |
| Mon | 10:00 AM | Harlow Bakery LLC | Q3 payroll walkthrough |
| Tue | 2:00 PM | Chen Family | Missing document check-in |
| Thu | 11:30 AM | Maple Street Dental PC | Onboarding kickoff |
| Fri | 9:00 AM | Priya Nair | Estimated tax planning |`,
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
      text: `Two clients have outstanding documents:

| Client | Missing | Requested |
| --- | --- | --- |
| Chen Family | 1099-INT, 1098-T | Oct 6 |
| Priya Nair | Q3 estimated payment confirmation | Oct 12 |

Here is a draft you can adapt:

> Hi, a quick reminder that we are still waiting on the items listed below so we can keep your return moving. You can upload them in the portal or reply to this email. Thank you!`,
    },
  ],
  "conv-ortiz": [
    { id: "ortiz-1", role: "user", text: "Where are we with the Ortiz proposal?" },
    { id: "ortiz-2", role: "assistant", text: PROPOSAL_REPLY },
  ],
  "conv-payroll": [
    { id: "pay-1", role: "user", text: "Give me a summary of the Q3 payroll review." },
    {
      id: "pay-2",
      role: "assistant",
      text: `The Q3 payroll review for **Harlow Bakery LLC** is in review with Sam Patel.

- Gross wages: $214,300 across 9 employees.
- Weekend overtime ran about 18% above budget.
- Two payroll tax deposits were made one day late; no penalties have been assessed.

I recommend sending Dana a short note on overtime before the Oct 31 deadline.`,
    },
  ],
}
