import { NextResponse } from "next/server"
import { truncateResponse, estimateTokens } from "../constants"

export async function POST(req: Request) {
  console.log("[v0] Starting assistant chat...")

  try {
    const { threadId, assistantId, message } = await req.json()
    console.log("[v0] Request params:", { threadId, assistantId, messageLength: message?.length })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("[v0] No API key found")
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Step 1: Add message to thread
    console.log("[v0] Adding message to thread...")
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: message,
      }),
    })

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text()
      console.error("[v0] Message add error:", errorText)
      return NextResponse.json({ error: `Failed to add message: ${errorText}` }, { status: messageResponse.status })
    }

    const messageData = await messageResponse.json()
    console.log("[v0] Message added:", messageData.id)

    // Step 2: Create run with streaming
    console.log("[v0] Creating run with streaming...")
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        stream: true,
      }),
    })

    if (!runResponse.ok) {
      const errorText = await runResponse.text()
      console.error("[v0] Run creation error:", errorText)
      return NextResponse.json({ error: `Failed to create run: ${errorText}` }, { status: runResponse.status })
    }

    // Step 3: Stream the response and handle function calls
    console.log("[v0] Starting stream with function call handling...")

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false
        let totalOutputTokens = 0
        let functionCallCount = 0

        const safeClose = () => {
          if (!isClosed) {
            isClosed = true
            console.log("[v0] Token usage summary:", {
              inputTokens: estimateTokens(message),
              outputTokens: totalOutputTokens,
              totalTokens: estimateTokens(message) + totalOutputTokens,
              functionCalls: functionCallCount,
            })
            controller.close()
            console.log("[v0] Stream closed")
          }
        }

        try {
          async function handleFunctionCalls(streamReader: ReadableStreamDefaultReader<Uint8Array>, isInitial = true) {
            const decoder = new TextDecoder()
            let buffer = ""
            let currentRunId = ""

            while (true) {
              if (isClosed) {
                console.log("[v0] Stream already closed, stopping read loop")
                break
              }

              let readResult
              try {
                readResult = await streamReader.read()
              } catch (readError) {
                console.error("[v0] Stream read error:", readError)
                if (readError instanceof Error && readError.message.includes("network")) {
                  console.log("[v0] Network error detected, closing stream gracefully")
                  break
                }
                throw readError
              }

              const { done, value } = readResult

              if (done) {
                console.log("[v0] Stream complete, total length:", buffer.length)
                break
              }

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split("\n")
              buffer = lines.pop() || ""

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6)
                  if (data === "[DONE]") {
                    continue
                  }

                  try {
                    const parsed = JSON.parse(data)

                    if (parsed.object === "thread.run" && parsed.id) {
                      currentRunId = parsed.id
                      console.log("[v0] Run ID:", currentRunId, "Status:", parsed.status)

                      if (["failed", "cancelled", "expired"].includes(parsed.status)) {
                        const errorMsg =
                          parsed.last_error?.message || "Request failed. Please try again with a simpler query."
                        console.error("[v0] Run failed:", errorMsg)

                        if (!isClosed) {
                          controller.enqueue(
                            encoder.encode(
                              `data: ${JSON.stringify({
                                content: `I apologize, but I encountered an error: ${errorMsg}`,
                              })}\n\n`,
                            ),
                          )
                        }
                        return
                      }
                    }

                    if (parsed.object === "thread.run" && parsed.status === "requires_action") {
                      const toolCalls = parsed.required_action?.submit_tool_outputs?.tool_calls || []
                      const toolOutputs = []

                      functionCallCount += toolCalls.length

                      for (const toolCall of toolCalls) {
                        console.log("[v0] Calling:", toolCall.function.name)
                        const functionArgs = JSON.parse(toolCall.function.arguments)

                        let functionResult = ""

                        try {
                          const baseUrl = req.url.split("/api")[0]
                          const endpoints: Record<string, string> = {
                            search_airtable_client: "/api/airtable/search-client",
                            get_meeting_debriefs: "/api/airtable/get-meeting-debriefs",
                            search_karbon_by_id: "/api/karbon/search-by-id",
                            web_search: "/api/web/search",
                            web_scrape: "/api/web/scrape",
                            call_zapier_mcp: "/api/zapier/mcp",
                            extract_pdf_text: "/api/adobe/extract",
                            compress_pdf: "/api/adobe/compress",
                            combine_pdfs: "/api/adobe/combine",
                            convert_pdf: "/api/adobe/convert",
                          }

                          const endpoint = endpoints[toolCall.function.name]
                          if (endpoint) {
                            const abortController = new AbortController()
                            const timeoutId = setTimeout(() => abortController.abort(), 30000)

                            try {
                              const response = await fetch(`${baseUrl}${endpoint}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(functionArgs),
                                signal: abortController.signal,
                              })

                              clearTimeout(timeoutId)

                              const responseData = await response.json()

                              if (!response.ok || responseData.error) {
                                functionResult = JSON.stringify({
                                  success: false,
                                  error: responseData.error || "Service unavailable",
                                  message:
                                    responseData.message ||
                                    `The ${toolCall.function.name} service is temporarily unavailable.`,
                                  suggestion:
                                    toolCall.function.name === "web_search"
                                      ? "I can provide guidance based on my training data, but cannot verify the latest information. For critical tax matters, please verify directly with IRS.gov or consult the Internal Revenue Code."
                                      : "Please try again or use an alternative approach.",
                                  details: responseData.details || responseData,
                                })
                              } else {
                                const truncatedData = truncateResponse(responseData)
                                functionResult = JSON.stringify(truncatedData)

                                const responseTokens = estimateTokens(functionResult)
                                console.log(`[v0] Function ${toolCall.function.name} response tokens:`, responseTokens)
                                totalOutputTokens += responseTokens
                              }
                            } catch (fetchError) {
                              clearTimeout(timeoutId)
                              throw fetchError
                            }
                          }
                        } catch (error) {
                          console.error("[v0] Function call error:", error)
                          functionResult = JSON.stringify({
                            success: false,
                            error: "Function call failed",
                            message: `The ${toolCall.function.name} function encountered an error and is temporarily unavailable.`,
                            suggestion:
                              toolCall.function.name === "web_search"
                                ? "I can provide guidance based on my training data with appropriate disclaimers about currency of information."
                                : "Please try again or suggest an alternative approach.",
                            details: error instanceof Error ? error.message : "Unknown error",
                          })
                        }

                        toolOutputs.push({
                          tool_call_id: toolCall.id,
                          output: functionResult,
                        })
                      }

                      console.log("[v0] Submitting", toolOutputs.length, "tool outputs")
                      const submitResponse = await fetch(
                        `https://api.openai.com/v1/threads/${threadId}/runs/${currentRunId}/submit_tool_outputs`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${apiKey}`,
                            "OpenAI-Beta": "assistants=v2",
                          },
                          body: JSON.stringify({
                            tool_outputs: toolOutputs,
                            stream: true,
                          }),
                        },
                      )

                      if (!submitResponse.ok) {
                        console.error("[v0] Tool output submission failed:", await submitResponse.text())
                        continue
                      }

                      console.log("[v0] Processing continuation stream")

                      const submitReader = submitResponse.body?.getReader()
                      if (submitReader) {
                        await handleFunctionCalls(submitReader, false)
                      }

                      return
                    }

                    if (parsed.object === "thread.message.delta") {
                      const delta = parsed.delta?.content?.[0]
                      if (delta?.type === "text" && delta.text?.value) {
                        const deltaTokens = estimateTokens(delta.text.value)
                        totalOutputTokens += deltaTokens

                        if (!isClosed) {
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ content: delta.text.value })}\n\n`),
                          )
                        }
                      }
                    }
                  } catch (e) {
                    const errorMsg = e instanceof Error ? e.message : "Unknown error"
                    console.error("[v0] Error parsing stream data:", errorMsg)
                  }
                }
              }
            }
          }

          const reader = runResponse.body?.getReader()
          if (!reader) throw new Error("No response body")

          await handleFunctionCalls(reader, true)

          safeClose()
        } catch (error) {
          console.error("[v0] Stream error:", error)
          if (!isClosed) {
            controller.error(error)
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Error in assistant chat:", error)
    return NextResponse.json(
      {
        error: "Failed to process chat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
