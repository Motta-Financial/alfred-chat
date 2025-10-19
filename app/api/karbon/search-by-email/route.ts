import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] Karbon: Starting search by email...")

  try {
    const { email, clientType } = await request.json()
    console.log("[v0] Karbon: Email to search:", email, "Client type hint:", clientType || "unknown")

    const authToken = process.env.KARBON_AUTH_TOKEN
    const apiKey = process.env.KARBON_API_KEY

    if (!authToken || !apiKey) {
      console.error("[v0] Karbon: Missing authentication credentials")
      return NextResponse.json({ error: "Karbon credentials not configured" }, { status: 500 })
    }

    const searchContacts = clientType !== "organization"
    const searchOrganizations = clientType !== "individual"

    let matchingContacts: any[] = []
    let matchingOrgs: any[] = []

    if (searchContacts) {
      console.log("[v0] Karbon: Step 1 - Searching Contacts (individuals)...")
      const contactsResponse = await fetch(`https://api.karbonhq.com/v3/Contacts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          AccessKey: apiKey,
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Karbon: Contacts response status:", contactsResponse.status)

      const contactsData = contactsResponse.ok ? await contactsResponse.json() : { value: [] }
      console.log("[v0] Karbon: Total contacts fetched:", contactsData.value?.length || 0)

      // Log sample contact structure for debugging
      if (contactsData.value?.length > 0) {
        console.log(
          "[v0] Karbon: Sample contact structure:",
          JSON.stringify(contactsData.value[0], null, 2).substring(0, 500),
        )
      }

      matchingContacts = (contactsData.value || []).filter((contact: any) => {
        const contactEmail =
          contact.EmailAddress?.toLowerCase() ||
          contact.Email?.toLowerCase() ||
          contact.PrimaryEmail?.toLowerCase() ||
          ""

        return contactEmail === email.toLowerCase()
      })

      console.log("[v0] Karbon: Matching contacts found:", matchingContacts.length)

      if (matchingContacts.length > 0) {
        console.log("[v0] Karbon: ✓ Found in Contacts - returning results")
        return NextResponse.json({
          source: "contacts",
          contacts: matchingContacts,
          organizations: [],
          workItems: [],
          total: matchingContacts.length,
        })
      }
    }

    if (searchOrganizations) {
      console.log("[v0] Karbon: Step 2 - Searching Organizations (entities)...")
      const orgsResponse = await fetch(`https://api.karbonhq.com/v3/Organizations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          AccessKey: apiKey,
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Karbon: Organizations response status:", orgsResponse.status)

      const orgsData = orgsResponse.ok ? await orgsResponse.json() : { value: [] }
      console.log("[v0] Karbon: Total organizations fetched:", orgsData.value?.length || 0)

      // Log sample organization structure for debugging
      if (orgsData.value?.length > 0) {
        console.log(
          "[v0] Karbon: Sample organization structure:",
          JSON.stringify(orgsData.value[0], null, 2).substring(0, 500),
        )
      }

      matchingOrgs = (orgsData.value || []).filter((org: any) => {
        // Check various possible email field structures
        const hasEmailInArray = org.EmailAddresses?.some(
          (e: any) =>
            e.EmailAddress?.toLowerCase() === email.toLowerCase() ||
            e.Email?.toLowerCase() === email.toLowerCase() ||
            e?.toLowerCase() === email.toLowerCase(),
        )

        const hasDirectEmail =
          org.Email?.toLowerCase() === email.toLowerCase() ||
          org.EmailAddress?.toLowerCase() === email.toLowerCase() ||
          org.PrimaryEmail?.toLowerCase() === email.toLowerCase()

        return hasEmailInArray || hasDirectEmail
      })

      console.log("[v0] Karbon: Matching organizations found:", matchingOrgs.length)

      const enrichedResults = {
        source: matchingOrgs.length > 0 ? "organizations" : "none",
        organizations: matchingOrgs,
        contacts: [],
        workItems: [] as any[],
        total: matchingOrgs.length,
      }

      if (matchingOrgs.length > 0) {
        console.log("[v0] Karbon: Fetching work items for matched organizations...")
        for (const org of matchingOrgs) {
          const orgId = org.ClientGroupKey || org.Key || org.Id
          if (orgId) {
            try {
              const workItemsResponse = await fetch(
                `https://api.karbonhq.com/v3/WorkItems?$filter=ClientGroupKey eq '${orgId}'`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                    AccessKey: apiKey,
                    "Content-Type": "application/json",
                  },
                },
              )

              if (workItemsResponse.ok) {
                const workItemsData = await workItemsResponse.json()
                enrichedResults.workItems.push(...(workItemsData.value || []))
                console.log("[v0] Karbon: Found", workItemsData.value?.length || 0, "work items for org", orgId)
              }
            } catch (error) {
              console.error("[v0] Karbon: Error fetching work items for org", orgId, error)
            }
          }
        }
      }

      console.log(
        "[v0] Karbon: Search complete -",
        enrichedResults.total,
        "clients found in",
        enrichedResults.source,
        ",",
        enrichedResults.workItems.length,
        "work items",
      )

      return NextResponse.json(enrichedResults)
    }

    console.log("[v0] Karbon: No matching clients found")

    return NextResponse.json({
      source: "none",
      contacts: [],
      organizations: [],
      workItems: [],
      total: 0,
    })
  } catch (error) {
    console.error("[v0] Karbon: Error in search:", error)
    return NextResponse.json(
      {
        error: "Failed to search Karbon by email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
