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

    const webSearchEnabled = !!(braveApiKey && braveApiKey.trim().length > 0)
    console.log("[v0] Web search enabled:", webSearchEnabled)

    const zapierApiKey = process.env.ZAPIER_MCP_API_KEY
    const zapierEnabled = !!(zapierApiKey && zapierApiKey.trim().length > 0)
    console.log("[v0] Zapier MCP enabled:", zapierEnabled)

    const adobeClientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID
    const adobeClientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET
    const adobeEnabled = !!(
      adobeClientId &&
      adobeClientSecret &&
      adobeClientId.trim().length > 0 &&
      adobeClientSecret.trim().length > 0
    )
    console.log("[v0] Adobe PDF Services enabled:", adobeEnabled)

    console.log("[v0] Creating assistant with available capabilities...")

    const tools: any[] = [
      { type: "code_interpreter" },
      { type: "file_search" },
      {
        type: "function",
        function: {
          name: "search_airtable_client",
          description:
            "Search Motta's client database by last name, first name, or organization. Returns email, client number, Karbon ID.",
          parameters: {
            type: "object",
            properties: {
              searchTerm: { type: "string", description: "Last name, first name, or organization" },
              searchType: { type: "string", enum: ["lastName", "firstName", "organization"] },
            },
            required: ["searchTerm"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_meeting_debriefs",
          description: "Get meeting history for a client using Client Number.",
          parameters: {
            type: "object",
            properties: {
              clientNumber: { type: "string", description: "Client Number from Airtable" },
              clientName: { type: "string" },
              clientEmail: { type: "string" },
            },
            required: ["clientNumber"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "search_karbon_by_id",
          description: "Get Karbon data using Client ID from Airtable. Returns work items and context.",
          parameters: {
            type: "object",
            properties: {
              karbonClientId: { type: "string", description: "Karbon Client ID from Airtable" },
              clientType: { type: "string", enum: ["individual", "organization"] },
            },
            required: ["karbonClientId", "clientType"],
          },
        },
      },
    ]

    if (webSearchEnabled) {
      tools.push(
        {
          type: "function",
          function: {
            name: "web_search",
            description:
              "REQUIRED for current tax info: rates, limits, IRS guidance, new laws, forms. Search IRS.gov, tax courts, official sources. Use BEFORE calculations/advice on current-year topics.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "Search query. Examples: '2024 standard deduction', 'IRC 199A qualified business income', 'IRS Notice 2024-XX'",
                },
                numResults: { type: "number", default: 5, description: "Number of results (1-10)" },
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
              "Extract full content from specific URLs (IRS publications, tax court rulings, official guidance). Use after web_search to get complete details.",
            parameters: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Full URL to scrape (e.g., https://www.irs.gov/pub/irs-pdf/p334.pdf)",
                },
              },
              required: ["url"],
            },
          },
        },
      )
    }

    if (zapierEnabled) {
      tools.push({
        type: "function",
        function: {
          name: "call_zapier_mcp",
          description: "Execute Zapier workflows for Gmail, Slack, Calendar, QuickBooks, HubSpot, Drive, etc.",
          parameters: {
            type: "object",
            properties: {
              zapierAction: {
                type: "string",
                description: "Zapier action (e.g., 'gmail_send_email', 'gcal_create_event')",
              },
              zapierParams: { type: "object", additionalProperties: true },
            },
            required: ["zapierAction"],
          },
        },
      })
    }

    if (adobeEnabled) {
      tools.push(
        {
          type: "function",
          function: {
            name: "extract_pdf_text",
            description: "Extract text and tables from PDFs. Returns JSON with extracted content.",
            parameters: {
              type: "object",
              properties: {
                fileUrl: { type: "string" },
                fileName: { type: "string" },
              },
              required: ["fileUrl", "fileName"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "compress_pdf",
            description: "Compress PDF to reduce file size. Choose LOW/MEDIUM/HIGH compression.",
            parameters: {
              type: "object",
              properties: {
                fileUrl: { type: "string" },
                fileName: { type: "string" },
                compressionLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
              },
              required: ["fileUrl", "fileName"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "combine_pdfs",
            description: "Merge multiple PDFs into one document.",
            parameters: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      fileUrl: { type: "string" },
                      fileName: { type: "string" },
                    },
                    required: ["fileUrl", "fileName"],
                  },
                },
                outputFileName: { type: "string", default: "combined.pdf" },
              },
              required: ["files"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "convert_pdf",
            description: "Convert PDF to Word, Excel, PowerPoint, or images.",
            parameters: {
              type: "object",
              properties: {
                fileUrl: { type: "string" },
                fileName: { type: "string" },
                targetFormat: { type: "string", enum: ["docx", "xlsx", "pptx", "jpeg", "png"] },
              },
              required: ["fileUrl", "fileName", "targetFormat"],
            },
          },
        },
      )
    }

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
        model: "gpt-4o-mini", // Use GPT-4o-mini for better cost efficiency while maintaining quality
        tools,
        temperature: 0.7, // Added temperature for more consistent responses
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
