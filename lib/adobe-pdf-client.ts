import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  ExtractPDFParams,
  ExtractElementType,
  ExtractPDFJob,
  ExtractPDFResult,
  CompressPDFParams,
  CompressionLevel,
  CompressPDFJob,
  CompressPDFResult,
  CombinePDFJob,
  CombinePDFParams,
  CombinePDFResult,
  ExportPDFParams,
  ExportPDFTargetFormat,
  ExportPDFJob,
  ExportPDFResult,
  SDKError,
  ServiceUsageError,
  ServiceApiError,
} from "@adobe/pdfservices-node-sdk"

// Initialize Adobe PDF Services client with OAuth credentials
export function createAdobePDFClient() {
  const clientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID
  const clientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      "Adobe PDF Services credentials not configured. Please set ADOBE_PDF_SERVICES_CLIENT_ID and ADOBE_PDF_SERVICES_CLIENT_SECRET environment variables.",
    )
  }

  console.log("[v0] Creating Adobe PDF Services client with OAuth credentials")
  console.log("[v0] Client ID:", clientId.substring(0, 8) + "...")

  try {
    // Create credentials using OAuth Server-to-Server flow
    const credentials = new ServicePrincipalCredentials({
      clientId,
      clientSecret,
    })

    // Create PDFServices instance
    const pdfServices = new PDFServices({ credentials })

    console.log("[v0] Adobe PDF Services client created successfully")
    return pdfServices
  } catch (error) {
    console.error("[v0] Error creating Adobe PDF Services client:", error)
    throw error
  }
}

// Helper function to handle Adobe SDK errors
export function handleAdobeError(error: unknown): {
  message: string
  statusCode: number
} {
  console.error("[v0] Adobe PDF Services error:", error)

  if (error instanceof SDKError) {
    return {
      message: `Adobe SDK Error: ${error.message}`,
      statusCode: 500,
    }
  }

  if (error instanceof ServiceUsageError) {
    return {
      message: `Service Usage Error: ${error.message}. Check your Adobe account limits.`,
      statusCode: 429,
    }
  }

  if (error instanceof ServiceApiError) {
    return {
      message: `Adobe API Error: ${error.message}`,
      statusCode: error.statusCode || 500,
    }
  }

  return {
    message: error instanceof Error ? error.message : "Unknown error occurred",
    statusCode: 500,
  }
}

export {
  MimeType,
  ExtractPDFParams,
  ExtractElementType,
  ExtractPDFJob,
  ExtractPDFResult,
  CompressPDFParams,
  CompressionLevel,
  CompressPDFJob,
  CompressPDFResult,
  CombinePDFJob,
  CombinePDFParams,
  CombinePDFResult,
  ExportPDFParams,
  ExportPDFTargetFormat,
  ExportPDFJob,
  ExportPDFResult,
}
