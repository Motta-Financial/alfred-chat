import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] Adobe PDF Services: Starting PDF combination...")

  try {
    const clientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID
    const clientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error("[v0] Adobe PDF Services: Credentials not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Adobe PDF Services credentials not configured",
          message: "Please configure ADOBE_PDF_SERVICES_CLIENT_ID and ADOBE_PDF_SERVICES_CLIENT_SECRET",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 PDF files required for combining" },
        { status: 400 },
      )
    }

    console.log("[v0] Adobe PDF Services: Combining", files.length, "PDFs")

    // Get access token
    const tokenResponse = await fetch("https://pdf-services.adobe.io/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] Adobe PDF Services: Token error:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to authenticate",
          details: errorText,
        },
        { status: tokenResponse.status },
      )
    }

    const { access_token } = await tokenResponse.json()

    // Upload all PDFs
    const assetIDs: string[] = []

    for (const file of files) {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const uploadResponse = await fetch("https://pdf-services.adobe.io/assets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "x-api-key": clientId,
        },
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error("[v0] Adobe PDF Services: Upload error for", file.name, ":", errorText)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to upload ${file.name}`,
            details: errorText,
          },
          { status: uploadResponse.status },
        )
      }

      const { assetID } = await uploadResponse.json()
      assetIDs.push(assetID)
      console.log("[v0] Adobe PDF Services: Uploaded", file.name, "- Asset ID:", assetID)
    }

    // Combine PDFs
    const combineResponse = await fetch("https://pdf-services.adobe.io/operation/combinepdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
        "x-api-key": clientId,
      },
      body: JSON.stringify({
        assets: assetIDs.map((assetID) => ({ assetID })),
      }),
    })

    if (!combineResponse.ok) {
      const errorText = await combineResponse.text()
      console.error("[v0] Adobe PDF Services: Combine error:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to combine PDFs",
          details: errorText,
        },
        { status: combineResponse.status },
      )
    }

    const combineResult = await combineResponse.json()
    console.log("[v0] Adobe PDF Services: PDFs combined successfully")

    return NextResponse.json({
      success: true,
      combinedPdfUrl: combineResult.downloadUri,
      fileCount: files.length,
      fileSize: combineResult.size || 0,
    })
  } catch (error) {
    console.error("[v0] Adobe PDF Services: Error combining PDFs:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to combine PDFs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
