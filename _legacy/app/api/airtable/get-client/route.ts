import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] Airtable: Getting client details...")

  try {
    const { recordId } = await request.json()
    console.log("[v0] Airtable: Record ID:", recordId)

    const airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
    const baseId = "app29FvStmjP1Vyb2"
    const tableId = "tblkseFbhbBYamZls"

    if (!airtableToken) {
      console.error("[v0] Airtable: No personal access token found")
      return NextResponse.json({ error: "Airtable token not configured" }, { status: 500 })
    }

    const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`

    console.log("[v0] Airtable: Fetching record from:", url)

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

    const record = await response.json()
    console.log("[v0] Airtable: Retrieved client record")

    return NextResponse.json({ client: record.fields, recordId: record.id })
  } catch (error) {
    console.error("[v0] Airtable: Error getting client:", error)
    return NextResponse.json(
      {
        error: "Failed to get client from Airtable",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
