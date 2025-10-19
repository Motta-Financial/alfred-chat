import { NextResponse } from "next/server"

export async function GET() {
  console.log("[v0] Airtable: Running comprehensive test...")

  try {
    const airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
    const baseId = "app29FvStmjP1Vyb2"
    const tableId = "tblkseFbhbBYamZls"

    console.log("[v0] Airtable: Token exists:", !!airtableToken)
    console.log("[v0] Airtable: Token length:", airtableToken?.length || 0)
    console.log("[v0] Airtable: Base ID:", baseId)
    console.log("[v0] Airtable: Table ID:", tableId)

    if (!airtableToken) {
      return NextResponse.json(
        {
          success: false,
          error: "AIRTABLE_PERSONAL_ACCESS_TOKEN not configured",
          message: "Please add your Airtable Personal Access Token to environment variables",
        },
        { status: 500 },
      )
    }

    // Test 1: Get sample records to see available fields
    console.log("[v0] Airtable: Test 1 - Getting sample records...")
    const sampleUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=3`
    const sampleResponse = await fetch(sampleUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${airtableToken}`,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] Airtable: Sample response status:", sampleResponse.status)

    if (!sampleResponse.ok) {
      const errorText = await sampleResponse.text()
      console.error("[v0] Airtable: Sample test failed:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: `Airtable API returned ${sampleResponse.status}`,
          details: errorText,
        },
        { status: sampleResponse.status },
      )
    }

    const sampleData = await sampleResponse.json()
    const availableFields = sampleData.records?.[0] ? Object.keys(sampleData.records[0].fields) : []
    console.log("[v0] Airtable: Available fields:", availableFields.join(", "))

    // Test 2: Search for David Rokeach
    console.log("[v0] Airtable: Test 2 - Searching for David Rokeach...")
    const searchTerm = "David Rokeach"
    const searchFormula = `OR(
      SEARCH(LOWER("${searchTerm}"), LOWER({First Name})),
      SEARCH(LOWER("${searchTerm}"), LOWER({Last Name})),
      SEARCH(LOWER("${searchTerm}"), LOWER(CONCATENATE({First Name}, " ", {Last Name})))
    )`

    console.log("[v0] Airtable: Search formula:", searchFormula)

    const searchUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(searchFormula)}`
    const searchResponse = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${airtableToken}`,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] Airtable: Search response status:", searchResponse.status)

    let searchResults = null
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      console.log("[v0] Airtable: Found", searchData.records?.length || 0, "matching records")
      searchResults = searchData.records?.map((record: any) => ({
        id: record.id,
        name: `${record.fields["First Name"] || ""} ${record.fields["Last Name"] || ""}`.trim(),
        email: record.fields["Primary Email"],
        fields: record.fields,
      }))

      if (searchResults && searchResults.length > 0) {
        console.log("[v0] Airtable: David Rokeach found!")
        console.log("[v0] Airtable: Email:", searchResults[0].email)
      } else {
        console.log("[v0] Airtable: David Rokeach NOT found")
      }
    } else {
      const searchError = await searchResponse.text()
      console.error("[v0] Airtable: Search failed:", searchError)
    }

    return NextResponse.json({
      success: true,
      message: "Airtable comprehensive test complete!",
      test1_sampleRecords: {
        recordCount: sampleData.records?.length || 0,
        availableFields,
        sampleRecord: sampleData.records?.[0]
          ? {
              id: sampleData.records[0].id,
              fields: sampleData.records[0].fields,
            }
          : null,
      },
      test2_davidRokeachSearch: {
        found: searchResults && searchResults.length > 0,
        resultCount: searchResults?.length || 0,
        results: searchResults,
      },
    })
  } catch (error) {
    console.error("[v0] Airtable: Test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test failed with exception",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
