import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] Zapier MCP request received")

  try {
    const { zapierAction, zapierParams = {} } = await request.json()
    console.log("[v0] Zapier action:", zapierAction)
    console.log("[v0] Zapier params:", JSON.stringify(zapierParams, null, 2))

    const zapierApiKey = process.env.ZAPIER_MCP_API_KEY

    if (!zapierApiKey) {
      console.error("[v0] Zapier MCP API key not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Zapier MCP not configured",
          message: "Zapier MCP integration is not set up. Please add ZAPIER_MCP_API_KEY to environment variables.",
          suggestion: "See ZAPIER_MCP_SETUP_GUIDE.md for configuration instructions.",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Calling Zapier NLA API...")
    const zapierNlaEndpoint = `https://nla.zapier.com/api/v1/dynamic/exposed/${zapierAction}`

    console.log("[v0] Endpoint:", zapierNlaEndpoint)
    console.log("[v0] Request body:", JSON.stringify(zapierParams, null, 2))

    const response = await fetch(zapierNlaEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": zapierApiKey,
      },
      body: JSON.stringify(zapierParams),
    })

    console.log("[v0] Zapier NLA response status:", response.status)
    const responseText = await response.text()
    console.log("[v0] Zapier NLA response body:", responseText)

    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { error: responseText }
      }

      console.error("[v0] Zapier NLA error:", errorData)

      return NextResponse.json(
        {
          success: false,
          error: errorData.error || "Zapier action failed",
          message: `The Zapier action "${zapierAction}" could not be completed.`,
          details: errorData,
          statusCode: response.status,
          suggestion:
            response.status === 404
              ? `Action "${zapierAction}" not found. Verify the action ID is correct and configured in your Zapier dashboard.`
              : response.status === 401
                ? "Authentication failed. Check your ZAPIER_MCP_API_KEY is correct."
                : "Verify the action is configured in your Zapier MCP dashboard and you have the necessary permissions.",
        },
        { status: response.status },
      )
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { result: responseText }
    }

    console.log("[v0] Zapier NLA success:", JSON.stringify(data, null, 2))

    return NextResponse.json({
      success: true,
      action: zapierAction,
      result: data,
    })
  } catch (error) {
    console.error("[v0] Zapier MCP error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Zapier request failed",
        message: "An error occurred while executing the Zapier action.",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your Zapier MCP configuration and try again.",
      },
      { status: 500 },
    )
  }
}
