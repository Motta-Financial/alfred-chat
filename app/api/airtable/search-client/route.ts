import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] Airtable: Starting sequential client search...")

  try {
    const { searchTerm, searchType } = await request.json()
    console.log("[v0] Airtable: Search term:", searchTerm, "Type:", searchType || "auto")

    const airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
    const baseId = "app29FvStmjP1Vyb2"
    const tableId = "tblkseFbhbBYamZls"

    console.log("[v0] Airtable: Token exists:", !!airtableToken)
    console.log("[v0] Airtable: Token length:", airtableToken?.length || 0)
    console.log("[v0] Airtable: Token starts with:", airtableToken?.substring(0, 10) || "N/A")

    if (!airtableToken) {
      console.log("[v0] Airtable: No token configured - returning configuration error response")
      return NextResponse.json({
        success: false,
        clients: [],
        count: 0,
        configurationError: true,
        message:
          "Airtable integration is not configured. The AIRTABLE_PERSONAL_ACCESS_TOKEN environment variable needs to be set with a valid Airtable API key or Personal Access Token. You can get this from your Airtable account settings.",
      })
    }

    // Check if token is a placeholder
    if (airtableToken.includes("your_") || airtableToken.includes("placeholder")) {
      console.log("[v0] Airtable: Token is a placeholder - returning configuration error response")
      return NextResponse.json({
        success: false,
        clients: [],
        count: 0,
        configurationError: true,
        message:
          "Airtable integration is not properly configured. The AIRTABLE_PERSONAL_ACCESS_TOKEN environment variable contains a placeholder value. Please replace it with your actual Airtable API key or Personal Access Token from your Airtable account settings.",
      })
    }

    // Support both old API keys (key...) and new Personal Access Tokens (pat...)
    const isValidToken = airtableToken.startsWith("pat") || airtableToken.startsWith("key")

    if (!isValidToken) {
      console.log("[v0] Airtable: Token format invalid - returning configuration error response")
      return NextResponse.json({
        success: false,
        clients: [],
        count: 0,
        configurationError: true,
        message:
          "Airtable token format is invalid. Airtable tokens should start with 'pat' (Personal Access Token) or 'key' (API Key). Please check the AIRTABLE_PERSONAL_ACCESS_TOKEN environment variable.",
      })
    }

    console.log("[v0] Airtable: Using", airtableToken.startsWith("pat") ? "Personal Access Token" : "API Key")

    let formula = ""

    if (searchType === "lastName") {
      formula = `SEARCH(LOWER("${searchTerm}"), LOWER({Last Name}))`
      console.log("[v0] Airtable: Searching Last Name field only")
    } else if (searchType === "firstName") {
      formula = `SEARCH(LOWER("${searchTerm}"), LOWER({First Name}))`
      console.log("[v0] Airtable: Searching First Name field only")
    } else if (searchType === "organization") {
      formula = `SEARCH(LOWER("${searchTerm}"), LOWER({Organization}))`
      console.log("[v0] Airtable: Searching Organization field")
    } else {
      formula = `OR(
        SEARCH(LOWER("${searchTerm}"), LOWER({First Name})),
        SEARCH(LOWER("${searchTerm}"), LOWER({Last Name})),
        SEARCH(LOWER("${searchTerm}"), LOWER(CONCATENATE({First Name}, " ", {Last Name}))),
        SEARCH(LOWER("${searchTerm}"), LOWER({Organization}))
      )`
      console.log("[v0] Airtable: Searching all available fields including Organization")
    }

    const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(formula)}`

    console.log("[v0] Airtable: Making request with formula:", formula)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${airtableToken}`,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] Airtable: Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Airtable: API error:", errorText)

      if (response.status === 401) {
        console.log("[v0] Airtable: Authentication failed - returning configuration error response")
        return NextResponse.json({
          success: false,
          clients: [],
          count: 0,
          configurationError: true,
          message:
            "Airtable authentication failed. The token is invalid or expired. Please verify your AIRTABLE_PERSONAL_ACCESS_TOKEN environment variable contains a valid Airtable API key or Personal Access Token.",
        })
      }

      return NextResponse.json({
        success: false,
        clients: [],
        count: 0,
        error: `Airtable API error: ${response.status}`,
        message: `Failed to search Airtable: ${errorText}`,
      })
    }

    const data = await response.json()
    console.log("[v0] Airtable: Found", data.records?.length || 0, "matching clients")

    const clients =
      data.records?.map((record: any) => ({
        id: record.id,
        name: `${record.fields["First Name"] || ""} ${record.fields["Last Name"] || ""}`.trim(),
        firstName: record.fields["First Name"],
        lastName: record.fields["Last Name"],
        organization: record.fields.Organization,
        primaryEmail: record.fields["Primary Email"],
        karbonClientId: record.fields["Karbon Client ID"],
        // Return ALL fields for comprehensive client information
        allFields: record.fields,
      })) || []

    console.log("[v0] Airtable: Returning", clients.length, "clients with all fields")
    clients.forEach((client: any) => {
      console.log(
        `[v0] Airtable: Client "${client.name}" - Organization: ${client.organization} - Primary Email: ${client.primaryEmail} - Karbon ID: ${client.karbonClientId}`,
      )
      console.log(`[v0] Airtable: Available fields:`, Object.keys(client.allFields).join(", "))
    })

    return NextResponse.json({ success: true, clients, count: clients.length })
  } catch (error) {
    console.error("[v0] Airtable: Error searching clients:", error)
    return NextResponse.json({
      success: false,
      clients: [],
      count: 0,
      error: "Failed to search Airtable",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}
