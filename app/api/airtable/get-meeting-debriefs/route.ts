import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] Airtable: Starting meeting debriefs search...")

  try {
    const { clientNumber, clientName, clientEmail } = await request.json()
    console.log(
      "[v0] Airtable: Searching debriefs for Client Number:",
      clientNumber,
      "Name:",
      clientName,
      "Email:",
      clientEmail,
    )

    const airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
    const baseId = "app29FvStmjP1Vyb2"
    const debriefTableId = "tblg0uOXNrNl1EpDq"

    if (!airtableToken) {
      console.error("[v0] Airtable: No personal access token found")
      return NextResponse.json({ error: "Airtable token not configured" }, { status: 500 })
    }

    let url = `https://api.airtable.com/v0/${baseId}/${debriefTableId}?maxRecords=100`

    if (clientNumber) {
      // Filter by Client Number using the linked record field
      const filterFormula = `SEARCH("${clientNumber}", ARRAYJOIN({Client Number (from MASTER | Contact Database)}))`
      url += `&filterByFormula=${encodeURIComponent(filterFormula)}`
      console.log("[v0] Airtable: Filtering by Client Number:", clientNumber)
    }

    console.log("[v0] Airtable: Fetching meeting debriefs...")

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${airtableToken}`,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] Airtable: Meeting debriefs response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Airtable: API error:", errorText)

      console.log("[v0] Airtable: Formula failed, falling back to client-side filtering...")
      const fallbackUrl = `https://api.airtable.com/v0/${baseId}/${debriefTableId}?maxRecords=100`
      const fallbackResponse = await fetch(fallbackUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!fallbackResponse.ok) {
        return NextResponse.json(
          { error: `Airtable API error: ${response.status}`, details: errorText },
          { status: response.status },
        )
      }

      const fallbackData = await fallbackResponse.json()
      const allDebriefs = fallbackData.records || []

      // Filter client-side by Client Number
      const matchingDebriefs = allDebriefs.filter((record: any) => {
        const clientNumberField = record.fields["Client Number (from MASTER | Contact Database)"]
        if (Array.isArray(clientNumberField)) {
          return clientNumberField.includes(clientNumber)
        }
        return clientNumberField === clientNumber
      })

      console.log("[v0] Airtable: Found", matchingDebriefs.length, "matching meeting debriefs via fallback")

      const debriefs = matchingDebriefs.map((record: any) => ({
        id: record.id,
        allFields: record.fields,
        createdTime: record.createdTime,
      }))

      return NextResponse.json({ debriefs, count: debriefs.length })
    }

    const data = await response.json()
    console.log("[v0] Airtable: Found", data.records?.length || 0, "matching meeting debriefs")

    const debriefs = (data.records || []).map((record: any) => ({
      id: record.id,
      allFields: record.fields,
      createdTime: record.createdTime,
    }))

    if (debriefs.length > 0) {
      console.log("[v0] Airtable: Sample debrief fields:", Object.keys(debriefs[0].allFields).join(", "))
    }

    return NextResponse.json({ debriefs, count: debriefs.length })
  } catch (error) {
    console.error("[v0] Airtable: Error searching meeting debriefs:", error)
    return NextResponse.json(
      {
        error: "Failed to search meeting debriefs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
