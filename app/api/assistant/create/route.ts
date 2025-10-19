import { NextResponse } from "next/server"
import { ALFRED_INSTRUCTIONS } from "../constants"

export async function POST() {
  console.log("[v0] Starting assistant creation...")

  try {
    const apiKey = process.env.OPENAI_API_KEY
    console.log("[v0] API Key exists:", !!apiKey)

    if (!apiKey) {
      console.error("[v0] No API key found in environment")
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY
    console.log("[v0] BRAVE_SEARCH_API_KEY exists:", !!braveApiKey)
    console.log("[v0] BRAVE_SEARCH_API_KEY length:", braveApiKey?.length || 0)
    console.log("[v0] BRAVE_SEARCH_API_KEY first 10 chars:", braveApiKey?.substring(0, 10) || "N/A")

    // Check if the key is actually set and not empty
    const webSearchEnabled = !!(braveApiKey && braveApiKey.trim().length > 0)
    console.log("[v0] Web search enabled:", webSearchEnabled)

    console.log("[v0] Creating assistant with available capabilities...")

    const tools: any[] = [
      { type: "code_interpreter" },
      { type: "file_search" },
      {
        type: "function",
        function: {
          name: "search_airtable_client",
          description:
            "Search Motta's client database. Sequential workflow: Last Name → First Name → Organization. Returns Primary Email, Client Number, Karbon ID.",
          parameters: {
            type: "object",
            properties: {
              searchTerm: {
                type: "string",
                description: "Last name, first name, or organization",
              },
              searchType: {
                type: "string",
                description: "Search field: lastName, firstName, or organization",
                enum: ["lastName", "firstName", "organization"],
              },
            },
            required: ["searchTerm"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_meeting_debriefs",
          description:
            "Get all meeting history for a client using Client Number. Returns comprehensive relationship timeline.",
          parameters: {
            type: "object",
            properties: {
              clientNumber: {
                type: "string",
                description: "Client Number from Airtable",
              },
              clientName: {
                type: "string",
                description: "Optional: Client name for fallback",
              },
              clientEmail: {
                type: "string",
                description: "Optional: Email for fallback",
              },
            },
            required: ["clientNumber"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "search_karbon_by_id",
          description:
            "Get Karbon data using Client ID/Key from Airtable. Searches Contacts (individuals) or Organizations (entities). Returns work items and practice context.",
          parameters: {
            type: "object",
            properties: {
              karbonClientId: {
                type: "string",
                description: "Karbon Client ID or Key from Airtable",
              },
              clientType: {
                type: "string",
                description: "individual (Contacts) or organization (Organizations)",
                enum: ["individual", "organization"],
              },
            },
            required: ["karbonClientId", "clientType"],
          },
        },
      },
    ]

    tools.push(
      {
        type: "function",
        function: {
          name: "web_search",
          description:
            "Search the web for current information. Use for tax law updates, IRS guidance, regulations, industry news, or any information not in client databases. Requires BRAVE_SEARCH_API_KEY to be configured.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query (e.g., 'IRS 2024 tax brackets', 'Section 179 deduction limits')",
              },
              numResults: {
                type: "number",
                description: "Number of results to return (default: 5, max: 10)",
                default: 5,
              },
            },
            required: ["query"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "web_scrape",
          description:
            "Extract content from a specific URL. Use to read articles, IRS pages, tax resources, or documentation. Requires BRAVE_SEARCH_API_KEY to be configured.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to scrape (e.g., 'https://www.irs.gov/newsroom/...')",
              },
            },
            required: ["url"],
          },
        },
      },
    )

    console.log("[v0] Total tools configured:", tools.length)
    console.log("[v0] Tool names:", tools.map((t) => (t.type === "function" ? t.function.name : t.type)).join(", "))

    const response = await fetch("https://api.openai.com/v1/assistants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        name: "ALFRED AI",
        instructions: ALFRED_INSTRUCTIONS,
        model: "gpt-4o",
        tools,
      }),
    })

    console.log("[v0] OpenAI API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] OpenAI API error:", errorText)
      return NextResponse.json({ error: `OpenAI API error: ${response.status}` }, { status: response.status })
    }

    const assistant = await response.json()
    console.log("[v0] Assistant created:", assistant.id)

    return NextResponse.json({ assistantId: assistant.id })
  } catch (error) {
    console.error("[v0] Error creating assistant:", error)
    return NextResponse.json(
      {
        error: "Failed to create assistant",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
