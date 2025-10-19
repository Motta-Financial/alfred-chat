import { NextResponse } from "next/server"

const KARBON_API_BASE = "https://api.karbonhq.com/v3"
const KARBON_AUTH_TOKEN = "14b90c98-032c-4d8e-8bd2-7426c10749c9"
const KARBON_API_KEY =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJLYXJib25IUSIsInJlZyI6InVzMiIsInRhayI6IjZEQjY3OERDLTdGNDYtNDU3RC04ODc1LTgwQTE2NjcwOTQ3RiIsImlhdCI6MTc0Nzg0MjMyNy4wfQ.7Q_ifFn0wFnyqg6T6FQ6TPCa88-Yd-6ogQQUnMCFUGc"

export async function POST(req: Request) {
  console.log("[v0] Karbon: Fetching contacts...")

  try {
    const { organizationId, searchTerm } = await req.json()
    console.log("[v0] Karbon: Organization ID:", organizationId, "Search term:", searchTerm)

    const url = new URL(`${KARBON_API_BASE}/Contacts`)

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
    console.log("[v0] Karbon: Received", data.value?.length || 0, "contacts")

    let contacts = data.value || []

    if (organizationId || searchTerm) {
      contacts = contacts.filter((contact: any) => {
        let matches = true

        if (organizationId) {
          matches = matches && contact.ClientGroupKey === organizationId
        }

        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          const fullName = contact.FullName?.toLowerCase() || ""
          const firstName = contact.FirstName?.toLowerCase() || ""
          const lastName = contact.LastName?.toLowerCase() || ""
          const email = contact.EmailAddress?.toLowerCase() || ""

          matches =
            matches &&
            (fullName.includes(searchLower) ||
              firstName.includes(searchLower) ||
              lastName.includes(searchLower) ||
              email.includes(searchLower))
        }

        return matches
      })
      console.log("[v0] Karbon: Filtered to", contacts.length, "contacts")
    }

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error("[v0] Karbon: Error fetching contacts:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch contacts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
