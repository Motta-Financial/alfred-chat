import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] Karbon: Starting direct lookup by Karbon ID...")

  try {
    const { karbonClientId, clientType } = await request.json()
    console.log("[v0] Karbon: Karbon Client ID:", karbonClientId, "Client type:", clientType || "unknown")

    const authToken = process.env.KARBON_AUTH_TOKEN
    const apiKey = process.env.KARBON_API_KEY

    if (!authToken || !apiKey) {
      console.error("[v0] Karbon: Missing authentication credentials")
      return NextResponse.json({ error: "Karbon credentials not configured" }, { status: 500 })
    }

    const results = {
      source: [] as string[],
      contact: null as any,
      organization: null as any,
      workItems: [] as any[],
      total: 0,
    }

    if (clientType === "individual" || !clientType) {
      console.log("[v0] Karbon: Fetching Contact by ContactKey using direct GET...")
      try {
        const contactResponse = await fetch(`https://api.karbonhq.com/v3/Contacts/${karbonClientId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            AccessKey: apiKey,
            "Content-Type": "application/json",
          },
        })

        console.log("[v0] Karbon: Contact response status:", contactResponse.status)

        if (contactResponse.ok) {
          const contactData = await contactResponse.json()
          console.log("[v0] Karbon: Found contact:", contactData.FullName || contactData.DisplayName)
          results.contact = contactData
          results.source.push("contact")
          results.total += 1

          console.log("[v0] Karbon: Fetching work items...")
          try {
            const workItemsResponse = await fetch(`https://api.karbonhq.com/v3/WorkItems?$top=100`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${authToken}`,
                AccessKey: apiKey,
                "Content-Type": "application/json",
              },
            })

            if (workItemsResponse.ok) {
              const workItemsData = await workItemsResponse.json()
              const allWorkItems = workItemsData.value || []
              results.workItems = allWorkItems.filter(
                (item: any) =>
                  item.ClientKey === karbonClientId ||
                  item.Client?.ContactKey === karbonClientId ||
                  item.Client?.OrganizationKey === karbonClientId,
              )
              console.log("[v0] Karbon: Found", results.workItems.length, "work items for contact")
            }
          } catch (error) {
            console.error("[v0] Karbon: Error fetching work items:", error)
          }
        } else if (contactResponse.status === 404) {
          console.log("[v0] Karbon: Contact not found, will try organization...")
        } else {
          const errorText = await contactResponse.text()
          console.error("[v0] Karbon: Contact API error:", errorText)
        }
      } catch (error) {
        console.error("[v0] Karbon: Error fetching contact:", error)
      }
    }

    if ((clientType === "organization" || !clientType) && !results.contact) {
      console.log("[v0] Karbon: Fetching Organization by OrganizationKey using direct GET...")
      try {
        const orgResponse = await fetch(`https://api.karbonhq.com/v3/Organizations/${karbonClientId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            AccessKey: apiKey,
            "Content-Type": "application/json",
          },
        })

        console.log("[v0] Karbon: Organization response status:", orgResponse.status)

        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          console.log("[v0] Karbon: Found organization:", orgData.DisplayName || orgData.LegalName)
          results.organization = orgData
          results.source.push("organization")
          results.total += 1

          console.log("[v0] Karbon: Fetching work items...")
          try {
            const workItemsResponse = await fetch(`https://api.karbonhq.com/v3/WorkItems?$top=100`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${authToken}`,
                AccessKey: apiKey,
                "Content-Type": "application/json",
              },
            })

            if (workItemsResponse.ok) {
              const workItemsData = await workItemsResponse.json()
              const allWorkItems = workItemsData.value || []
              results.workItems = allWorkItems.filter(
                (item: any) =>
                  item.ClientKey === karbonClientId ||
                  item.Client?.ContactKey === karbonClientId ||
                  item.Client?.OrganizationKey === karbonClientId,
              )
              console.log("[v0] Karbon: Found", results.workItems.length, "work items for organization")
            }
          } catch (error) {
            console.error("[v0] Karbon: Error fetching work items:", error)
          }
        } else if (orgResponse.status === 404) {
          console.log("[v0] Karbon: Organization not found")
        } else {
          const errorText = await orgResponse.text()
          console.error("[v0] Karbon: Organization API error:", errorText)
        }
      } catch (error) {
        console.error("[v0] Karbon: Error fetching organization:", error)
      }
    }

    if (results.total === 0) {
      console.log("[v0] Karbon: No matching client found in either Contacts or Organizations")
      return NextResponse.json({
        source: [],
        contact: null,
        organization: null,
        workItems: [],
        total: 0,
      })
    }

    console.log(
      `[v0] Karbon: Returning ${results.contact ? "1 contact" : "0 contacts"} and ${results.organization ? "1 organization" : "0 organizations"} with ${results.workItems.length} work items`,
    )
    return NextResponse.json(results)
  } catch (error) {
    console.error("[v0] Karbon: Error in search:", error)
    return NextResponse.json(
      {
        error: "Failed to search Karbon by ID",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
