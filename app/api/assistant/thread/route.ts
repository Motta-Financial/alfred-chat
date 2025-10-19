import { NextResponse } from "next/server"

export async function POST() {
  console.log("[v0] Creating new thread...")

  try {
    const apiKey = process.env.OPENAI_API_KEY
    console.log("[v0] API Key exists:", !!apiKey)

    if (!apiKey) {
      console.error("[v0] No API key found")
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("[v0] Making request to OpenAI threads API...")

    const response = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({}),
    })

    console.log("[v0] Thread creation response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Thread creation error:", errorText)
      return NextResponse.json(
        { error: `Failed to create thread: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    const thread = await response.json()
    console.log("[v0] Thread created successfully:", thread.id)

    return NextResponse.json({ threadId: thread.id })
  } catch (error) {
    console.error("[v0] Error in thread creation:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        error: "Failed to create thread",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
