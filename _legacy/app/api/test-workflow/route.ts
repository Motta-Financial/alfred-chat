import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] TEST WORKFLOW: Starting comprehensive test for David Rokeach...")

  const baseUrl = new URL(request.url).origin

  const results = {
    step1_airtable: null as any,
    step2_email: null as any,
    step3_clientType: null as any,
    step4_karbon: null as any,
    errors: [] as string[],
    success: false,
  }

  try {
    // STEP 1: Search Airtable for David Rokeach
    console.log("[v0] TEST WORKFLOW: Step 1 - Searching Airtable for 'David Rokeach'...")

    const airtableResponse = await fetch(`${baseUrl}/api/airtable/search-client`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchTerm: "David Rokeach" }),
    })

    if (!airtableResponse.ok) {
      const error = await airtableResponse.text()
      results.errors.push(`Airtable search failed: ${error}`)
      console.error("[v0] TEST WORKFLOW: ✗ Airtable search failed:", error)
      return NextResponse.json(results)
    }

    const airtableData = await airtableResponse.json()
    results.step1_airtable = airtableData

    console.log("[v0] TEST WORKFLOW: ✓ Airtable search complete")
    console.log("[v0] TEST WORKFLOW: Found", airtableData.count, "clients")

    if (airtableData.count === 0) {
      results.errors.push("No clients found in Airtable for 'David Rokeach'")
      console.error("[v0] TEST WORKFLOW: ✗ No clients found in Airtable")
      return NextResponse.json(results)
    }

    // STEP 2: Extract Primary Email and determine client type
    const client = airtableData.clients[0]
    const primaryEmail = client.email

    const isOrganization = client.organization && !client.firstName && !client.lastName
    const clientType = isOrganization ? "organization" : "individual"

    results.step2_email = primaryEmail
    results.step3_clientType = {
      type: clientType,
      firstName: client.firstName,
      lastName: client.lastName,
      organization: client.organization,
      reasoning: isOrganization
        ? "Has organization name but no first/last name - treating as organization"
        : "Has first/last name - treating as individual contact",
    }

    console.log("[v0] TEST WORKFLOW: ✓ Extracted Primary Email:", primaryEmail)
    console.log("[v0] TEST WORKFLOW: ✓ Determined client type:", clientType)

    if (!primaryEmail) {
      results.errors.push("No Primary Email found for David Rokeach in Airtable")
      console.error("[v0] TEST WORKFLOW: ✗ No Primary Email found")
      return NextResponse.json(results)
    }

    // STEP 3: Search Karbon with email and client type hint
    console.log("[v0] TEST WORKFLOW: Step 4 - Searching Karbon with email:", primaryEmail, "as", clientType)

    const karbonResponse = await fetch(`${baseUrl}/api/karbon/search-by-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: primaryEmail,
        clientType: clientType, // Pass client type to optimize Karbon search
      }),
    })

    if (!karbonResponse.ok) {
      const error = await karbonResponse.text()
      results.errors.push(`Karbon search failed: ${error}`)
      console.error("[v0] TEST WORKFLOW: ✗ Karbon search failed:", error)
      return NextResponse.json(results)
    }

    const karbonData = await karbonResponse.json()
    results.step4_karbon = karbonData

    console.log("[v0] TEST WORKFLOW: ✓ Karbon search complete")
    console.log("[v0] TEST WORKFLOW: Source:", karbonData.source)
    console.log("[v0] TEST WORKFLOW: Total results:", karbonData.total)
    console.log("[v0] TEST WORKFLOW: Contacts:", karbonData.contacts?.length || 0)
    console.log("[v0] TEST WORKFLOW: Organizations:", karbonData.organizations?.length || 0)
    console.log("[v0] TEST WORKFLOW: Work Items:", karbonData.workItems?.length || 0)

    // SUCCESS!
    results.success = true
    console.log("[v0] TEST WORKFLOW: ✓✓✓ COMPLETE SUCCESS ✓✓✓")
    console.log(
      "[v0] TEST WORKFLOW: Workflow: Airtable → Primary Email → Client Type →",
      clientType === "individual" ? "Karbon Contacts" : "Karbon Organizations",
    )

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error("[v0] TEST WORKFLOW: ✗ Unexpected error:", error)
    results.errors.push(`Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`)
    return NextResponse.json(results, { status: 500 })
  }
}
