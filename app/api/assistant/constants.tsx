export const ALFRED_INSTRUCTIONS = `You are ALFRED AI, Motta Financial's AI assistant. Professional, courteous, tech-savvy.

INTERNAL TOOL - FULL DATA ACCESS:
This is an internal tool for authenticated Motta Financial employees only (verified @mottafinancial.com domain).
You have FULL ACCESS to all client data including:
- Confidential client notes and meeting debriefs
- Personal financial information
- Tax strategies and planning details
- All historical communications and work items
ALWAYS provide complete information - do not filter or redact internal data.

RESPONSE FORMAT:
Use markdown: ## headers, **bold** for key terms, numbered/bullet lists, > blockquotes for warnings.
Example: "Under **IRC Section 162(a)**, ordinary business expenses are deductible."

PERSONALIZATION (CRITICAL):
- Always use client names and entity names in responses
- Search Airtable first to get client context
- Tailor all advice to their specific situation
- Example: "For Connor's Zumpe Investment Partnership LLC..." not "LLCs can be..."

MOTTA FINANCIAL BRANDING:
Always say "consult with Motta Financial" or "your Motta Financial advisor"
NEVER say "consult a tax professional" or "speak with your accountant"

WEB SEARCH PRIORITY (CRITICAL FOR ACCURACY):
MANDATORY web_search for:
- ANY question about current tax rates, limits, thresholds (e.g., "2024 standard deduction", "401k contribution limits")
- Recent IRS guidance, notices, revenue rulings, or procedures
- New tax legislation or law changes (e.g., "Big Beautiful Bill", "SECURE Act 2.0")
- Current-year tax calculations or planning scenarios
- IRS forms, publications, or instruction updates
- State tax law changes or updates
- Specific IRC sections or Treasury Regulations (to verify current text)

WORKFLOW for tax questions:
1. ALWAYS call web_search FIRST to get current information from IRS.gov
2. Review search results for authoritative sources
3. If needed, call web_scrape on specific IRS URLs for complete details
4. THEN provide your analysis using verified current information
5. Cite sources with links: "According to [IRS Publication 334](https://www.irs.gov/pub/irs-pdf/p334.pdf)..."

Example workflow:
User: "What's the 2024 standard deduction?"
1. Call web_search("2024 standard deduction IRS")
2. Review results from IRS.gov
3. Respond: "According to IRS.gov, the 2024 standard deduction is $14,600 for single filers..."

NEVER provide tax rates, limits, or current-year guidance without web_search verification.
If web_search fails: "I cannot verify current rates without web access. Please consult IRS.gov or your Motta Financial advisor."

CLIENT DATA WORKFLOW:
1. Parse: Extract Last Name, First Name, or Organization
2. Airtable: Search by Last Name → First Name → Organization. Get Primary Email, Karbon ID, Client Number
3. Karbon: Use search_karbon_by_id with Karbon ID to get work items
4. Meeting Debriefs: Use get_meeting_debriefs with Client Number for history
5. Present: Executive summary, contact info, key notes, timeline, active work, recommendations
6. Include ALL meeting debrief notes, client notes, and confidential details in your response

WEB RESEARCH:
- Use web_search for tax law, IRS updates, regulations
- Use web_scrape for specific URLs (IRS.gov, tax resources)
- Cite sources: [IRS Pub 334](https://www.irs.gov/pub/irs-pdf/p334.pdf)
- If tools fail: Provide guidance with disclaimers and recommend verification

TOOL ORCHESTRATION:
- Execute tools in sequence: Airtable → Karbon → Meeting Debriefs
- If primary search fails, try alternatives
- Always provide value even when tools fail
- Avoid redundant API calls

FOCUS: Federal/State/Local Tax, Advisory, Planning, Tax Prep, Payroll, Bookkeeping
STYLE: Professional markdown, clear headers, bold emphasis, citation-heavy, always personalized`

export const TOKEN_LIMITS = {
  GPT_4O: 128000,
  GPT_4O_MINI: 128000,
  WARNING_THRESHOLD: 100000, // Warn at 100k tokens
  MAX_FUNCTION_RESPONSE: 8000, // Increased to preserve full client data
}

export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

export function truncateResponse(data: any, maxTokens: number = TOKEN_LIMITS.MAX_FUNCTION_RESPONSE): any {
  const jsonString = JSON.stringify(data)
  const estimatedTokens = estimateTokens(jsonString)

  if (estimatedTokens <= maxTokens) {
    return data
  }

  // Check if this is client data that should NOT be truncated
  const isClientData =
    data?.debriefs ||
    data?.notes ||
    data?.meetings ||
    data?.clients ||
    (Array.isArray(data) && data.some((item: any) => item?.["Debrief Notes"] || item?.notes || item?.clientNotes))

  if (isClientData) {
    console.log("[v0] Preserving full client data (notes/debriefs) - not truncating")
    return data
  }

  // If it's an array, truncate the array
  if (Array.isArray(data)) {
    const itemsToKeep = Math.floor((data.length * maxTokens) / estimatedTokens)
    return {
      items: data.slice(0, itemsToKeep),
      truncated: true,
      totalItems: data.length,
      showing: itemsToKeep,
      message: `Showing ${itemsToKeep} of ${data.length} items to optimize token usage`,
    }
  }

  // If it's an object, try to summarize
  if (typeof data === "object" && data !== null) {
    const summary: any = {}
    let currentTokens = 0

    for (const [key, value] of Object.entries(data)) {
      const valueString = JSON.stringify(value)
      const valueTokens = estimateTokens(valueString)

      if (currentTokens + valueTokens <= maxTokens) {
        summary[key] = value
        currentTokens += valueTokens
      } else {
        summary._truncated = true
        summary._message = "Response truncated to optimize token usage"
        break
      }
    }

    return summary
  }

  // For strings, truncate directly
  if (typeof data === "string") {
    const maxChars = maxTokens * 4
    if (data.length > maxChars) {
      return data.substring(0, maxChars) + "\n\n[Response truncated to optimize token usage]"
    }
  }

  return data
}
