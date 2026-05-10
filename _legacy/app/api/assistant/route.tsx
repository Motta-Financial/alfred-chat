import OpenAI from "openai"
import { ALFRED_INSTRUCTIONS } from "./constants" // Declare or import ALFRED_INSTRUCTIONS

// Add console logging to debug API key and initialization
console.log("[ALFRED] Initializing OpenAI client...")
console.log("[ALFRED] API Key present:", !!process.env.OPENAI_API_KEY)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Create or get the assistant
async function getOrCreateAssistant() {
  try {
    console.log("[ALFRED] Getting or creating assistant...")
    // Try to get existing assistant by name
    const assistants = await openai.beta.assistants.list()
    const existingAssistant = assistants.data.find((a) => a.name === "ALFRED Ai")

    if (existingAssistant) {
      console.log("[ALFRED] Found existing assistant:", existingAssistant.id)
      return existingAssistant
    }

    // Create new assistant if none exists
    console.log("[ALFRED] Creating new assistant...")
    const assistant = await openai.beta.assistants.create({
      name: "ALFRED Ai",
      instructions: ALFRED_INSTRUCTIONS,
      model: "gpt-4o",
      tools: [{ type: "code_interpreter" }, { type: "file_search" }],
    })

    console.log("[ALFRED] Created assistant:", assistant.id)
    return assistant
  } catch (error) {
    console.error("[ALFRED] Error in getOrCreateAssistant:", error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    console.log("[ALFRED] Received POST request")
    const body = await req.json()
    console.log("[ALFRED] Request body:", body)

    const { action, threadId, message } = body

    // Create new thread
    if (action === "create_thread") {
      console.log("[ALFRED] Creating new thread...")
      const thread = await openai.beta.threads.create()
      console.log("[ALFRED] Thread created:", thread.id)
      return Response.json({ threadId: thread.id })
    }

    // Send message and get response
    if (action === "send_message") {
      if (!threadId || !message) {
        console.log("[ALFRED] Missing threadId or message")
        return Response.json({ error: "Missing threadId or message" }, { status: 400 })
      }

      console.log("[ALFRED] Sending message to thread:", threadId)
      const assistant = await getOrCreateAssistant()

      // Add message to thread
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
      })
      console.log("[ALFRED] Message added to thread")

      // Run the assistant
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistant.id,
      })
      console.log("[ALFRED] Run created:", run.id)

      // Poll for completion
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)

      while (runStatus.status !== "completed") {
        if (runStatus.status === "failed" || runStatus.status === "cancelled" || runStatus.status === "expired") {
          console.error("[ALFRED] Run failed with status:", runStatus.status)
          throw new Error(`Run ${runStatus.status}`)
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
        console.log("[ALFRED] Run status:", runStatus.status)
      }

      // Get the messages
      const messages = await openai.beta.threads.messages.list(threadId)
      const lastMessage = messages.data[0]

      if (lastMessage.role === "assistant" && lastMessage.content[0].type === "text") {
        console.log("[ALFRED] Response received")
        return Response.json({
          message: lastMessage.content[0].text.value,
          threadId,
        })
      }

      throw new Error("No assistant response found")
    }

    console.log("[ALFRED] Invalid action:", action)
    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    // Enhanced error logging and proper JSON error response
    console.error("[ALFRED] Error in POST handler:", error)
    console.error("[ALFRED] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })

    return Response.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        details: "My apologies, I encountered an error processing your request.",
      },
      { status: 500 },
    )
  }
}
