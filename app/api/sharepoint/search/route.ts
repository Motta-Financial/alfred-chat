import { NextResponse } from "next/server"

// Microsoft Graph API authentication and search
async function getAccessToken() {
  const tenantId = process.env.MICROSOFT_TENANT_ID
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    return {
      error: true,
      message:
        "SharePoint integration is not configured. Please set MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, and MICROSOFT_CLIENT_SECRET environment variables.",
    }
  }

  // Check for placeholder values
  if (
    tenantId.includes("your_") ||
    clientId.includes("your_") ||
    clientSecret.includes("your_") ||
    tenantId.includes("placeholder") ||
    clientId.includes("placeholder") ||
    clientSecret.includes("placeholder")
  ) {
    return {
      error: true,
      message:
        "SharePoint integration contains placeholder values. Please replace MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, and MICROSOFT_CLIENT_SECRET with actual values from your Azure AD app registration.",
    }
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] SharePoint: Token request failed:", errorText)
      return {
        error: true,
        message: `Failed to authenticate with Microsoft Graph API: ${response.status}`,
        details: errorText,
      }
    }

    const data = await response.json()
    return { accessToken: data.access_token }
  } catch (error) {
    console.log("[v0] SharePoint: Authentication error:", error)
    return {
      error: true,
      message: "Failed to authenticate with Microsoft Graph API",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function POST(request: Request) {
  console.log("[v0] SharePoint: Starting search...")

  try {
    const { query, clientName, entityTypes } = await request.json()
    console.log("[v0] SharePoint: Query:", query)
    console.log("[v0] SharePoint: Client name:", clientName)
    console.log("[v0] SharePoint: Entity types:", entityTypes)

    // Get access token
    const authResult = await getAccessToken()

    if ("error" in authResult) {
      console.log("[v0] SharePoint: Configuration error")
      return NextResponse.json({
        success: false,
        results: [],
        count: 0,
        configurationError: true,
        message: authResult.message,
        details: authResult.details,
      })
    }

    const { accessToken } = authResult

    // Build search query
    const searchQuery = clientName ? `${query} ${clientName}` : query

    // Prepare search request
    const searchBody = {
      requests: [
        {
          entityTypes: entityTypes || ["driveItem", "listItem", "site"],
          query: {
            queryString: searchQuery,
          },
          from: 0,
          size: 25,
          // Required for application permissions
          region: "NAM", // North America - adjust based on your SharePoint region
        },
      ],
    }

    console.log("[v0] SharePoint: Searching with query:", searchQuery)

    const searchResponse = await fetch("https://graph.microsoft.com/v1.0/search/query", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchBody),
    })

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.log("[v0] SharePoint: Search failed:", errorText)

      if (searchResponse.status === 401) {
        return NextResponse.json({
          success: false,
          results: [],
          count: 0,
          configurationError: true,
          message:
            "SharePoint authentication failed. Please verify your Microsoft credentials are correct and have the necessary permissions (Sites.Read.All, Files.Read.All).",
        })
      }

      return NextResponse.json({
        success: false,
        results: [],
        count: 0,
        error: `SharePoint search failed: ${searchResponse.status}`,
        message: errorText,
      })
    }

    const searchData = await searchResponse.json()
    console.log("[v0] SharePoint: Search response received")

    // Parse results
    const hits = searchData.value?.[0]?.hitsContainers?.[0]?.hits || []
    console.log("[v0] SharePoint: Found", hits.length, "results")

    const results = hits.map((hit: any) => ({
      id: hit.resource?.id,
      name: hit.resource?.name,
      webUrl: hit.resource?.webUrl,
      summary: hit.summary,
      type: hit.resource?.["@odata.type"],
      lastModified: hit.resource?.lastModifiedDateTime,
      createdBy: hit.resource?.createdBy?.user?.displayName,
      path: hit.resource?.parentReference?.path,
    }))

    console.log("[v0] SharePoint: Returning", results.length, "formatted results")

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      query: searchQuery,
    })
  } catch (error) {
    console.error("[v0] SharePoint: Error:", error)
    return NextResponse.json({
      success: false,
      results: [],
      count: 0,
      error: "SharePoint search failed",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}
