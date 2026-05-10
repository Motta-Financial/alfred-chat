import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] Airtable: Starting sequential client search...")

  try {
    const { searchTerm, searchType } = await request.json()
    console.log("[v0] Airtable: Search term:", searchTerm, "Type:", searchType || "auto")

    const airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
    const baseId = "app29FvStmjP1Vyb2"
    const tableId = "tblkseFbhbBYamZls"

    if (!airtableToken) {
      console.error("[v0] Airtable: No personal access token found")
      return NextResponse.json({ error: "Airtable token not configured" }, { status: 500 })
    }

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
      return NextResponse.json(
        { error: `Airtable API error: ${response.status}`, details: errorText },
        { status: response.status },
      )
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

    return NextResponse.json({ clients, count: clients.length })
  } catch (error) {
    console.error("[v0] Airtable: Error searching clients:", error)
    return NextResponse.json(
      {
        error: "Failed to search Airtable",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
