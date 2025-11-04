import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    console.log("[v0] Web scrape request received:", url)

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
          message: "Please provide a URL to scrape.",
        },
        { status: 200 },
      )
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL",
          message: "The provided URL is not valid.",
        },
        { status: 200 },
      )
    }

    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY
    console.log("[v0] BRAVE_SEARCH_API_KEY exists:", !!braveApiKey)

    try {
      console.log("[v0] Fetching URL:", url)
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "max-age=0",
        },
      })

      console.log("[v0] Fetch response status:", response.status)

      if (!response.ok) {
        const statusMessages: Record<number, string> = {
          404: "The page was not found. It may have been moved or deleted.",
          403: "Access to this page is forbidden. The site may be blocking automated access.",
          500: "The server encountered an error. Please try again later.",
          503: "The service is temporarily unavailable. Please try again later.",
        }

        const message =
          statusMessages[response.status] || `The URL returned status ${response.status}. The page may be unavailable.`

        console.log("[v0] Web scrape failed - non-OK status:", {
          url,
          status: response.status,
          statusText: response.statusText,
        })

        return NextResponse.json(
          {
            success: false,
            error: `HTTP ${response.status}`,
            message,
            url,
            status: response.status,
            suggestion:
              response.status === 404
                ? "This URL may be outdated. Try searching for the topic on the official website instead."
                : "Please verify the URL is correct and try again.",
          },
          { status: 200 }, // Always return 200 so the assistant can handle it gracefully
        )
      }

      const html = await response.text()
      console.log("[v0] HTML content length:", html.length)

      // Basic HTML cleaning - remove scripts, styles, and extract text
      let cleanText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()

      // Limit to first 10000 characters to avoid token limits
      if (cleanText.length > 10000) {
        cleanText = cleanText.substring(0, 10000) + "... (content truncated)"
      }

      console.log("[v0] Clean text length:", cleanText.length)

      return NextResponse.json({
        success: true,
        url,
        content: cleanText,
        length: cleanText.length,
      })
    } catch (fetchError) {
      console.error("[v0] Fetch error:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Scraping failed",
          message:
            "Failed to fetch the URL. The site may be blocking automated access or may be temporarily unavailable.",
          details: fetchError instanceof Error ? fetchError.message : "Unknown error",
          url,
          suggestion: "Please verify the URL is accessible and try again.",
        },
        { status: 200 }, // Always return 200 so the assistant can handle it gracefully
      )
    }
  } catch (error) {
    console.error("[v0] Web scrape error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Scraping failed",
        message: "An unexpected error occurred during web scraping.",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Please try again or use an alternative URL.",
      },
      { status: 200 }, // Always return 200 so the assistant can handle it gracefully
    )
  }
}
