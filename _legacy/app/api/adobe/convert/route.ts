import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] Adobe PDF Services: Starting PDF conversion...")

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
    const file = formData.get("file") as File
    const targetFormat = (formData.get("targetFormat") as string) || "docx"

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    const validFormats = ["docx", "xlsx", "pptx", "png", "jpg"]
    if (!validFormats.includes(targetFormat.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid target format. Supported formats: ${validFormats.join(", ")}`,
        },
        { status: 400 },
      )
    }

    console.log("[v0] Adobe PDF Services: Converting", file.name, "to", targetFormat)

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

    // Upload PDF
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
      console.error("[v0] Adobe PDF Services: Upload error:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload PDF",
          details: errorText,
        },
        { status: uploadResponse.status },
      )
    }

    const { assetID } = await uploadResponse.json()
    console.log("[v0] Adobe PDF Services: PDF uploaded, converting to", targetFormat)

    // Convert PDF
    const convertResponse = await fetch("https://pdf-services.adobe.io/operation/exportpdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
        "x-api-key": clientId,
      },
      body: JSON.stringify({
        assetID,
        targetFormat: targetFormat.toUpperCase(),
      }),
    })

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text()
      console.error("[v0] Adobe PDF Services: Convert error:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to convert PDF",
          details: errorText,
        },
        { status: convertResponse.status },
      )
    }

    const convertResult = await convertResponse.json()
    console.log("[v0] Adobe PDF Services: Conversion complete")

    return NextResponse.json({
      success: true,
      convertedFileUrl: convertResult.downloadUri,
      format: targetFormat,
      fileName: file.name.replace(".pdf", `.${targetFormat}`),
    })
  } catch (error) {
    console.error("[v0] Adobe PDF Services: Error converting PDF:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to convert PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
