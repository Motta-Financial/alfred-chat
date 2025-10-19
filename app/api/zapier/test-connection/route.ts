import { NextResponse } from "next/server"

export async function GET() {
  console.log("[v0] Testing Zapier MCP connection...")

  try {
    const zapierApiKey = process.env.ZAPIER_MCP_API_KEY

    if (!zapierApiKey) {
      console.error("[v0] ZAPIER_MCP_API_KEY not found in environment variables")
      return NextResponse.json(
        {
          success: false,
          error: "API key not configured",
          message: "ZAPIER_MCP_API_KEY is not set in environment variables",
          suggestion: "Add ZAPIER_MCP_API_KEY to your environment variables in the Vars section",
        },
        { status: 500 },
      )
    }

    console.log("[v0] API key found, testing connection to Zapier NLA API...")

    // Test connection by listing available actions
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
      console.error("[v0] Zapier API error response:", errorText)

      return NextResponse.json(
        {
          success: false,
          error: "Connection failed",
          message: `Failed to connect to Zapier API (Status: ${response.status})`,
          details: errorText,
          suggestion:
            "Verify your API key is correct and you have configured actions in your Zapier MCP dashboard at https://actions.zapier.com/",
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Zapier API connection successful")
    console.log("[v0] Available actions:", data.results?.length || 0)

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Zapier MCP",
      actionsCount: data.results?.length || 0,
      apiKeyConfigured: true,
      endpoint: "https://nla.zapier.com/api/v1/dynamic/exposed",
    })
  } catch (error) {
    console.error("[v0] Zapier connection test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        message: "An error occurred while testing the Zapier connection",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your network connection and API key configuration",
      },
      { status: 500 },
    )
  }
}
