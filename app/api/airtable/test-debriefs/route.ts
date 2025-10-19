import { NextResponse } from "next/server"

export async function GET() {
  console.log("[v0] Testing Airtable Meeting Debriefs table...")

  try {
    const airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
    const baseId = "app29FvStmjP1Vyb2"
    const debriefTableId = "tblg0uOXNrNl1EpDq"

    if (!airtableToken) {
      return NextResponse.json({ error: "Airtable token not configured" }, { status: 500 })
    }

    const url = `https://api.airtable.com/v0/${baseId}/${debriefTableId}?maxRecords=1`

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

    return NextResponse.json({
      message: "Meeting Debriefs table structure",
      recordCount: data.records?.length || 0,
      sampleRecord: data.records?.[0],
      fieldNames: data.records?.[0] ? Object.keys(data.records[0].fields) : [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to test meeting debriefs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
