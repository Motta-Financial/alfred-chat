import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[v0] Airtable: Discovering field names...")

  try {
    const { searchParams } = new URL(request.url)
    const tableType = searchParams.get("table") || "contacts"

    const airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
    const baseId = "app29FvStmjP1Vyb2"

    const tableId = tableType === "debriefs" ? "tblg0uOXNrNl1EpDq" : "tblkseFbhbBYamZls"
    const tableName = tableType === "debriefs" ? "Meeting Debriefs" : "Contacts Database"

    if (!airtableToken) {
      return NextResponse.json({ error: "Airtable token not configured" }, { status: 500 })
    }

    // Fetch first record to see all available fields
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=1`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${airtableToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Airtable API error: ${response.status}`, details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    const fields = data.records?.[0]?.fields || {}
    const fieldNames = Object.keys(fields)

    console.log(`[v0] Airtable: ${tableName} has ${fieldNames.length} fields:`, fieldNames)

    return NextResponse.json({
      table: tableName,
      tableId,
      fieldCount: fieldNames.length,
      fieldNames,
      sampleRecord: fields,
    })
  } catch (error) {
    console.error("[v0] Airtable: Error discovering fields:", error)
    return NextResponse.json(
      {
        error: "Failed to discover fields",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
