import { NextResponse } from "next/server"

const KARBON_API_BASE = "https://api.karbonhq.com/v3"
const KARBON_AUTH_TOKEN = "14b90c98-032c-4d8e-8bd2-7426c10749c9"
const KARBON_API_KEY =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJLYXJib25IUSIsInJlZyI6InVzMiIsInRhayI6IjZEQjY3OERDLTdGNDYtNDU3RC04ODc1LTgwQTE2NjcwOTQ3RiIsImlhdCI6MTc0Nzg0MjMyNy4wfQ.7Q_ifFn0wFnyqg6T6FQ6TPCa88-Yd-6ogQQUnMCFUGc"

export async function POST(req: Request) {
  console.log("[v0] Karbon: Unified client search...")

  try {
    const { searchTerm } = await req.json()
    console.log("[v0] Karbon: Search term:", searchTerm)

    if (!searchTerm) {
      return NextResponse.json({ organizations: [], contacts: [] })
    }

    const searchLower = searchTerm.toLowerCase()

    // Fetch both Organizations and Contacts in parallel
    const [orgsResponse, contactsResponse] = await Promise.all([
      fetch(`${KARBON_API_BASE}/Organizations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          AccessKey: KARBON_API_KEY,
          Authorization: `Bearer ${KARBON_AUTH_TOKEN}`,
        },
      }),
      fetch(`${KARBON_API_BASE}/Contacts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          AccessKey: KARBON_API_KEY,
          Authorization: `Bearer ${KARBON_AUTH_TOKEN}`,
        },
      }),
    ])

    console.log("[v0] Karbon: Organizations status:", orgsResponse.status)
    console.log("[v0] Karbon: Contacts status:", contactsResponse.status)

    const orgsData = orgsResponse.ok ? await orgsResponse.json() : { value: [] }
    const contactsData = contactsResponse.ok ? await contactsResponse.json() : { value: [] }

    // Filter organizations
    const organizations = (orgsData.value || []).filter((org: any) => {
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

    // Filter contacts
    const contacts = (contactsData.value || []).filter((contact: any) => {
      const fullName = contact.FullName?.toLowerCase() || ""
      const firstName = contact.FirstName?.toLowerCase() || ""
      const lastName = contact.LastName?.toLowerCase() || ""
      const email = contact.EmailAddress?.toLowerCase() || ""

      return (
        fullName.includes(searchLower) ||
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        email.includes(searchLower)
      )
    })

    console.log("[v0] Karbon: Found", organizations.length, "organizations and", contacts.length, "contacts")

    return NextResponse.json({ organizations, contacts })
  } catch (error) {
    console.error("[v0] Karbon: Error in unified search:", error)
    return NextResponse.json(
      {
        error: "Failed to search clients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
