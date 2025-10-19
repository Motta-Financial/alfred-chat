import { NextResponse } from "next/server"
import { createAdobePDFClient, handleAdobeError } from "@/lib/adobe-pdf-client"

export async function GET() {
  console.log("[v0] Adobe PDF Services: Testing credentials...")

  try {
    const clientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID
    const clientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error("[v0] Adobe PDF Services: Credentials not found in environment")
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: "Adobe PDF Services credentials not configured",
          message: "ADOBE_PDF_SERVICES_CLIENT_ID and ADOBE_PDF_SERVICES_CLIENT_SECRET are required",
          expectedCredentials: {
            clientId: "4a2bf7ed85694653a12f763b26a7908f",
            note: "Check that your environment variables match the credentials from Adobe Developer Console",
          },
        },
        { status: 500 },
      )
    }

    console.log("[v0] Adobe PDF Services: Credentials found")
    console.log("[v0] Adobe PDF Services: Client ID:", clientId.substring(0, 10) + "...")
    console.log("[v0] Adobe PDF Services: Expected Client ID: 4a2bf7ed8569...")

    const pdfServices = createAdobePDFClient()

    console.log("[v0] Adobe PDF Services: Client created successfully!")

    return NextResponse.json({
      success: true,
      configured: true,
      authenticated: true,
      message: "Adobe PDF Services credentials are valid and SDK client created successfully",
      clientIdPrefix: clientId.substring(0, 10) + "...",
      sdkVersion: "@adobe/pdfservices-node-sdk",
      credentialType: "OAuth Server-to-Server",
    })
  } catch (error) {
    console.error("[v0] Adobe PDF Services: Error testing credentials:", error)
    const { message, statusCode } = handleAdobeError(error)

    return NextResponse.json(
      {
        success: false,
        configured: true,
        authenticated: false,
        error: "Failed to create Adobe PDF Services client",
        details: message,
        troubleshooting: [
          "Verify ADOBE_PDF_SERVICES_CLIENT_ID matches: 4a2bf7ed85694653a12f763b26a7908f",
          "Verify ADOBE_PDF_SERVICES_CLIENT_SECRET is set correctly",
          "Check if your Adobe PDF Services account is active",
          "Visit https://developer.adobe.com/console to verify your credentials",
        ],
      },
      { status: statusCode },
    )
  }
}
