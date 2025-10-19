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

    if (webSearchEnabled) {
      tools.push(
        {
          type: "function",
          function: {
            name: "web_search",
            description:
              "Search the web for current information. Use for tax law updates, IRS guidance, regulations, industry news, or any information not in client databases.",
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
              "Extract content from a specific URL. Use to read articles, IRS pages, tax resources, or documentation.",
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
    }

    if (zapierEnabled) {
      tools.push({
        type: "function",
        function: {
          name: "call_zapier_mcp",
          description:
            "Execute Zapier workflows to interact with 6000+ apps including Gmail, Slack, Google Calendar, QuickBooks, HubSpot, Google Drive, and more. Use this to send emails, search messages, create calendar events, retrieve CRM data, upload files, and automate cross-platform workflows. This is your gateway to all external business platforms.",
          parameters: {
            type: "object",
            properties: {
              zapierAction: {
                type: "string",
                description:
                  "The Zapier MCP action to execute. Examples: 'gmail_send_email', 'gmail_search_emails', 'gcal_create_event', 'gcal_find_events', 'slack_send_message', 'qb_get_customer', 'gdrive_search_files', 'hubspot_get_contact'",
              },
              zapierParams: {
                type: "object",
                description:
                  "Parameters for the Zapier action. Structure varies by action. Examples: {to: 'email@example.com', subject: 'Hello', body: 'Message'} for gmail_send_email, {query: 'from:john@example.com'} for gmail_search_emails, {summary: 'Meeting', start: '2024-01-15T10:00:00', end: '2024-01-15T11:00:00'} for gcal_create_event",
                additionalProperties: true,
              },
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
            description:
              "Extract text, tables, and structured content from PDF documents. Use this to analyze tax documents, financial statements, contracts, or any PDF that needs text extraction. Returns extracted text and table data in JSON format.",
            parameters: {
              type: "object",
              properties: {
                fileUrl: {
                  type: "string",
                  description: "URL or base64-encoded PDF file to extract text from",
                },
                fileName: {
                  type: "string",
                  description: "Name of the PDF file (e.g., 'tax-return-2024.pdf')",
                },
              },
              required: ["fileUrl", "fileName"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "compress_pdf",
            description:
              "Compress PDF files to reduce file size for easier sharing and storage. Useful for large tax documents, scanned files, or reports. Choose compression level based on quality needs.",
            parameters: {
              type: "object",
              properties: {
                fileUrl: {
                  type: "string",
                  description: "URL or base64-encoded PDF file to compress",
                },
                fileName: {
                  type: "string",
                  description: "Name of the PDF file",
                },
                compressionLevel: {
                  type: "string",
                  description: "Compression level: LOW (best quality), MEDIUM (balanced), HIGH (smallest size)",
                  enum: ["LOW", "MEDIUM", "HIGH"],
                  default: "MEDIUM",
                },
              },
              required: ["fileUrl", "fileName"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "combine_pdfs",
            description:
              "Merge multiple PDF files into a single document. Useful for combining tax forms, supporting documents, or creating comprehensive client packages.",
            parameters: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  description: "Array of PDF files to combine",
                  items: {
                    type: "object",
                    properties: {
                      fileUrl: {
                        type: "string",
                        description: "URL or base64-encoded PDF file",
                      },
                      fileName: {
                        type: "string",
                        description: "Name of the PDF file",
                      },
                    },
                    required: ["fileUrl", "fileName"],
                  },
                },
                outputFileName: {
                  type: "string",
                  description: "Name for the combined PDF file",
                  default: "combined.pdf",
                },
              },
              required: ["files"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "convert_pdf",
            description:
              "Convert PDF files to other formats (Word, Excel, PowerPoint, images). Useful for editing tax documents, extracting data to spreadsheets, or creating presentations.",
            parameters: {
              type: "object",
              properties: {
                fileUrl: {
                  type: "string",
                  description: "URL or base64-encoded PDF file to convert",
                },
                fileName: {
                  type: "string",
                  description: "Name of the PDF file",
                },
                targetFormat: {
                  type: "string",
                  description: "Target format for conversion",
                  enum: ["docx", "xlsx", "pptx", "jpeg", "png"],
                },
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
