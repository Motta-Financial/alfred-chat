import { NextResponse } from "next/server"

const KARBON_API_BASE = "https://api.karbonhq.com/v3"
const KARBON_AUTH_TOKEN = "14b90c98-032c-4d8e-8bd2-7426c10749c9"
const KARBON_API_KEY =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJLYXJib25IUSIsInJlZyI6InVzMiIsInRhayI6IjZEQjY3OERDLTdGNDYtNDU3RC04ODc1LTgwQTE2NjcwOTQ3RiIsImlhdCI6MTc0Nzg0MjMyNy4wfQ.7Q_ifFn0wFnyqg6T6FQ6TPCa88-Yd-6ogQQUnMCFUGc"

export async function POST(req: Request) {
  console.log("[v0] Karbon: Fetching work items...")

  try {
    const { organizationId, status } = await req.json()
    console.log("[v0] Karbon: Organization ID:", organizationId, "Status:", status)

    const url = new URL(`${KARBON_API_BASE}/WorkItems`)
    const filters = []

    if (organizationId) {
      filters.push(`ClientGroupKey eq '${organizationId}'`)
    }
    if (status) {
      filters.push(`Status eq '${status}'`)
    }

    if (filters.length > 0) {
      url.searchParams.append("$filter", filters.join(" and "))
    }

    // Expand to get more details
    url.searchParams.append("$expand", "AssignedTo,WorkType")

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
    console.log("[v0] Karbon: Found", data.value?.length || 0, "work items")

    return NextResponse.json({ workItems: data.value || [] })
  } catch (error) {
    console.error("[v0] Karbon: Error fetching work items:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch work items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
