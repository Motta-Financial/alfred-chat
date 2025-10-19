import { NextResponse } from "next/server"

export async function GET() {
  console.log("[v0] Listing Zapier MCP actions...")

  try {
    const zapierApiKey = process.env.ZAPIER_MCP_API_KEY

    if (!zapierApiKey) {
      console.error("[v0] ZAPIER_MCP_API_KEY not configured")
      return NextResponse.json(
        {
          success: false,
          error: "API key not configured",
          message: "ZAPIER_MCP_API_KEY is not set in environment variables",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Fetching available actions from Zapier NLA API...")

    const response = await fetch("https://nla.zapier.com/api/v1/dynamic/exposed", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": zapierApiKey,
      },
    })

    console.log("[v0] Zapier API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Zapier API error:", errorText)

      return NextResponse.json(
        {
          success: false,
          error: "Failed to list actions",
          message: `Zapier API returned status ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Successfully retrieved actions")
    console.log("[v0] Total actions:", data.results?.length || 0)

    if (data.results && data.results.length > 0) {
      console.log("[v0] Available actions:")
      data.results.forEach((action: any, index: number) => {
        console.log(`[v0]   ${index + 1}. ${action.id} - ${action.description}`)
      })
    }

    return NextResponse.json({
      success: true,
      actions: data.results || [],
      count: data.results?.length || 0,
      message: `Found ${data.results?.length || 0} configured Zapier actions`,
    })
  } catch (error) {
    console.error("[v0] Error listing Zapier actions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list actions",
        message: "An error occurred while retrieving Zapier actions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
