import { NextResponse } from "next/server"

const KARBON_API_BASE = "https://api.karbonhq.com/v3"
const KARBON_AUTH_TOKEN = "14b90c98-032c-4d8e-8bd2-7426c10749c9"
const KARBON_API_KEY =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJLYXJib25IUSIsInJlZyI6InVzMiIsInRhayI6IjZEQjY3OERDLTdGNDYtNDU3RC04ODc1LTgwQTE2NjcwOTQ3RiIsImlhdCI6MTc0Nzg0MjMyNy4wfQ.7Q_ifFn0wFnyqg6T6FQ6TPCa88-Yd-6ogQQUnMCFUGc"

export async function POST(req: Request) {
  console.log("[v0] Karbon: Fetching organizations...")

  try {
    const { searchTerm } = await req.json()
    console.log("[v0] Karbon: Search term:", searchTerm)

    const url = new URL(`${KARBON_API_BASE}/Organizations`)
    // Don't use OData filter since we don't know the exact property names
    // Instead, fetch all and filter client-side

    console.log("[v0] Karbon: Request URL:", url.toString())

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        AccessKey: KARBON_API_KEY,
        Authorization: `Bearer ${KARBON_AUTH_TOKEN}`,
      },
    })

    console.log("[v0] Karbon: Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Karbon: API error:", errorText)
      return NextResponse.json({ error: `Karbon API error: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Karbon: Received", data.value?.length || 0, "organizations")

    let organizations = data.value || []
    if (searchTerm && organizations.length > 0) {
      const searchLower = searchTerm.toLowerCase()
      organizations = organizations.filter((org: any) => {
        // Search across multiple possible name fields
        const displayName = org.DisplayName?.toLowerCase() || ""
        const legalName = org.LegalName?.toLowerCase() || ""
        const tradingName = org.TradingName?.toLowerCase() || ""
        const name = org.Name?.toLowerCase() || ""

        return (
          displayName.includes(searchLower) ||
          legalName.includes(searchLower) ||
          tradingName.includes(searchLower) ||
          name.includes(searchLower)
        )
      })
      console.log("[v0] Karbon: Filtered to", organizations.length, "organizations matching search")
    }

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error("[v0] Karbon: Error fetching organizations:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch organizations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
