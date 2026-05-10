import { NextResponse } from "next/server"
import {
  createAdobePDFClient,
  handleAdobeError,
  MimeType,
  ExtractPDFParams,
  ExtractElementType,
  ExtractPDFJob,
  ExtractPDFResult,
} from "@/lib/adobe-pdf-client"
import { Readable } from "stream"
import { Buffer } from "buffer"

export async function POST(request: Request) {
  console.log("[v0] Adobe PDF Services: Starting PDF extraction...")

  try {
    const pdfServices = createAdobePDFClient()

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] Adobe PDF Services: No file provided")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Adobe PDF Services: Processing file:", file.name, "Size:", file.size, "bytes")

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const readableStream = Readable.from(buffer)

    console.log("[v0] Adobe PDF Services: Creating input asset from file...")
    const inputAsset = await pdfServices.upload({
      readStream: readableStream,
      mimeType: MimeType.PDF,
    })

    console.log("[v0] Adobe PDF Services: Input asset created successfully")

    const params = new ExtractPDFParams({
      elementsToExtract: [ExtractElementType.TEXT, ExtractElementType.TABLES],
    })

    console.log("[v0] Adobe PDF Services: Creating extraction job...")
    const job = new ExtractPDFJob({ inputAsset, params })

    console.log("[v0] Adobe PDF Services: Submitting extraction job...")
    const pollingURL = await pdfServices.submit({ job })

    console.log("[v0] Adobe PDF Services: Polling for results...")
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: ExtractPDFResult,
    })

    console.log("[v0] Adobe PDF Services: Job completed successfully")
    const resultAsset = pdfServicesResponse.result.resource

    const streamAsset = await pdfServices.getContent({ asset: resultAsset })

    const chunks: Buffer[] = []
    for await (const chunk of streamAsset.readStream) {
      chunks.push(Buffer.from(chunk))
    }
    const resultBuffer = Buffer.concat(chunks)
    const extractedData = JSON.parse(resultBuffer.toString())

    console.log("[v0] Adobe PDF Services: Extraction completed successfully")
    console.log("[v0] Adobe PDF Services: Extracted elements:", Object.keys(extractedData))

    return NextResponse.json({
      success: true,
      data: extractedData,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error("[v0] Adobe PDF Services: Unexpected error during extraction:", error)
    const { message, statusCode } = handleAdobeError(error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract PDF",
        details: message,
      },
      { status: statusCode },
    )
  }
}
