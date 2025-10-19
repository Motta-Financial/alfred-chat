import { NextResponse } from "next/server"
import { braveSearchLimiter } from "@/lib/rate-limiter"

export async function POST(req: Request) {
  try {
    const { query, numResults = 5 } = await req.json()

    console.log("[v0] Web search request received:", { query, numResults })

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY
    console.log("[v0] BRAVE_SEARCH_API_KEY exists:", !!braveApiKey)

    if (!braveApiKey || braveApiKey.trim().length === 0) {
      console.error("[v0] Brave Search API key not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Web search not configured",
          message:
            "Web search requires the BRAVE_SEARCH_API_KEY environment variable to be set. Please add it to your Vercel project settings.",
          setupInstructions: {
            service: "Brave Search API",
            url: "https://brave.com/search/api/",
            freeTier: "2,000 queries per month (free)",
            steps: [
              "1. Visit https://brave.com/search/api/",
              "2. Sign up for a free account",
              "3. Generate an API key from your dashboard",
              "4. Add BRAVE_SEARCH_API_KEY to your Vercel project environment variables",
              "5. Redeploy your application",
            ],
          },
          results: [],
          count: 0,
        },
        { status: 200 },
      )
    }

    const isTaxQuery =
      query.toLowerCase().includes("irc") ||
      query.toLowerCase().includes("tax") ||
      query.toLowerCase().includes("irs") ||
      query.toLowerCase().includes("regulation") ||
      query.toLowerCase().includes("revenue ruling") ||
      query.toLowerCase().includes("deduction") ||
      query.toLowerCase().includes("credit") ||
      query.toLowerCase().includes("exemption") ||
      query.toLowerCase().includes("withholding") ||
      query.toLowerCase().includes("filing") ||
      query.toLowerCase().includes("form 1040") ||
      query.toLowerCase().includes("schedule") ||
      query.toLowerCase().includes("publication") ||
      /\b(20\d{2})\b/.test(query) // Detect year references like "2024"

    const siteFilter = isTaxQuery
      ? " site:irs.gov OR site:taxnotes.com OR site:ustaxcourt.gov OR site:treasury.gov OR site:congress.gov"
      : ""

    console.log("[v0] Enhanced query:", query + siteFilter)
    console.log("[v0] Is tax query:", isTaxQuery)

    try {
      console.log("[v0] Queuing Brave Search API request...")

      const data = await braveSearchLimiter.execute(async () => {
        console.log("[v0] Executing Brave Search API call...")
        const braveResponse = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + siteFilter)}&count=${numResults}`,
          {
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip",
              "X-Subscription-Token": braveApiKey,
            },
          },
        )

        console.log("[v0] Brave Search response status:", braveResponse.status)

        if (!braveResponse.ok) {
          const errorText = await braveResponse.text()
          console.error("[v0] Brave Search API error:", errorText)

          if (braveResponse.status === 429) {
            throw new Error("RATE_LIMITED: Brave Search API rate limit exceeded. Requests are queued at 1 per second.")
          }

          throw new Error(`Brave Search returned status ${braveResponse.status}: ${errorText}`)
        }

        return await braveResponse.json()
      })

      console.log("[v0] Brave Search results count:", data.web?.results?.length || 0)

      const results = (data.web?.results || []).slice(0, numResults).map((result: any) => ({
        title: result.title,
        url: result.url,
        snippet: result.description || "",
        published: result.age || null, // Include publication date if available
        relevance: result.page_age_days ? `Updated ${result.page_age_days} days ago` : null,
      }))

      return NextResponse.json({
        success: true,
        query,
        results,
        count: results.length,
        isTaxQuery,
        source: "brave",
        suggestion: results.length > 0 ? "Use web_scrape to get full content from specific URLs" : null,
      })
    } catch (braveError) {
      console.error("[v0] Brave Search failed:", braveError)

      const errorMessage = braveError instanceof Error ? braveError.message : "Unknown error"
      const isRateLimited = errorMessage.includes("RATE_LIMITED") || errorMessage.includes("429")

      return NextResponse.json(
        {
          success: false,
          error: isRateLimited ? "Rate limit exceeded" : "Search request failed",
          message: isRateLimited
            ? "Brave Search API rate limit reached (1 request per second on free tier). Your request has been queued and will be processed shortly."
            : "Failed to connect to Brave Search API. Please check your internet connection and API key.",
          details: errorMessage,
          results: [],
          count: 0,
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("[v0] Web search error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        message: "An unexpected error occurred during web search.",
        details: error instanceof Error ? error.message : "Unknown error",
        results: [],
        count: 0,
      },
      { status: 200 },
    )
  }
}
