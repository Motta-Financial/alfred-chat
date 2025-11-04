import { NextResponse } from "next/server"

const KARBON_API_BASE = "https://api.karbonhq.com/v3"
const KARBON_AUTH_TOKEN = "14b90c98-032c-4d8e-8bd2-7426c10749c9"
const KARBON_API_KEY =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJLYXJib25IUSIsInJlZyI6InVzMiIsInRhayI6IjZEQjY3OERDLTdGNDYtNDU3RC04ODc1LTgwQTE2NjcwOTQ3RiIsImlhdCI6MTc0Nzg0MjMyNy4wfQ.7Q_ifFn0wFnyqg6T6FQ6TPCa88-Yd-6ogQQUnMCFUGc"

function generateNameVariations(searchTerm: string): string[] {
  const variations = [searchTerm.toLowerCase()]

  // Check if it looks like a name (has space)
  if (searchTerm.includes(" ")) {
    const parts = searchTerm.trim().split(/\s+/)

    if (parts.length === 2) {
      const [first, last] = parts
      // Add "Last, First" format (common in Karbon)
      variations.push(`${last}, ${first}`.toLowerCase())
      // Add "Last First" format
      variations.push(`${last} ${first}`.toLowerCase())
      // Add individual parts for partial matching
      variations.push(first.toLowerCase())
      variations.push(last.toLowerCase())
    } else if (parts.length > 2) {
      // Handle middle names or multiple parts
      const first = parts[0]
      const last = parts[parts.length - 1]
      variations.push(`${last}, ${first}`.toLowerCase())
      variations.push(last.toLowerCase())
      variations.push(first.toLowerCase())
    }
  }

  return variations
}

async function fetchAllPages(url: string, headers: HeadersInit): Promise<any[]> {
  const allItems: any[] = []
  let nextUrl: string | null = url
  let pageCount = 0
  const maxPages = 10 // Safety limit to prevent infinite loops

  console.log("[v0] Karbon: Starting pagination...")

  while (nextUrl && pageCount < maxPages) {
    pageCount++
    console.log(`[v0] Karbon: Fetching page ${pageCount}...`)

    const response = await fetch(nextUrl, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      console.log(`[v0] Karbon: Error on page ${pageCount}:`, response.status)
      break
    }

    const data = await response.json()
    const items = data.value || []
    allItems.push(...items)

    console.log(`[v0] Karbon: Page ${pageCount} returned ${items.length} items (total: ${allItems.length})`)

    // Check for next page
    nextUrl = data["@odata.nextLink"] || null

    if (nextUrl) {
      console.log(`[v0] Karbon: Next page URL exists, continuing...`)
    } else {
      console.log(`[v0] Karbon: No more pages, pagination complete`)
    }
  }

  console.log(`[v0] Karbon: Pagination finished. Total items: ${allItems.length}, Pages fetched: ${pageCount}`)

  return allItems
}

export async function POST(req: Request) {
  console.log("[v0] Karbon: Unified client search...")

  try {
    const { searchTerm } = await req.json()
    console.log("[v0] Karbon: Search term:", searchTerm)

    if (!searchTerm) {
      return NextResponse.json({ organizations: [], contacts: [] })
    }

    const searchVariations = generateNameVariations(searchTerm)
    console.log("[v0] Karbon: Search variations:", searchVariations)

    const headers = {
      "Content-Type": "application/json",
      AccessKey: KARBON_API_KEY,
      Authorization: `Bearer ${KARBON_AUTH_TOKEN}`,
    }

    const [allOrgs, allContacts] = await Promise.all([
      fetchAllPages(`${KARBON_API_BASE}/Organizations`, headers),
      fetchAllPages(`${KARBON_API_BASE}/Contacts`, headers),
    ])

    console.log("[v0] Karbon: Total organizations fetched:", allOrgs.length)
    console.log("[v0] Karbon: Total contacts fetched:", allContacts.length)

    const matchingOrgs = allOrgs.filter((org: any) => {
      const fullName = (org.FullName || "").toLowerCase()
      return searchVariations.some((variation) => fullName.includes(variation))
    })

    const matchingContacts = allContacts.filter((contact: any) => {
      const fullName = (contact.FullName || "").toLowerCase()
      return searchVariations.some((variation) => fullName.includes(variation))
    })

    console.log("[v0] Karbon: Found", matchingOrgs.length, "matching organizations")
    console.log("[v0] Karbon: Found", matchingContacts.length, "matching contacts")

    if (matchingOrgs.length > 0) {
      console.log("[v0] Karbon: First matching org:", JSON.stringify(matchingOrgs[0], null, 2))
    }
    if (matchingContacts.length > 0) {
      console.log("[v0] Karbon: First matching contact:", JSON.stringify(matchingContacts[0], null, 2))
    }

    return NextResponse.json({
      organizations: matchingOrgs,
      contacts: matchingContacts,
    })
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
