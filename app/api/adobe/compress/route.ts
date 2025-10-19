import { NextResponse } from "next/server"
import {
  createAdobePDFClient,
  handleAdobeError,
  MimeType,
  CompressPDFParams,
  CompressionLevel,
  CompressPDFJob,
  CompressPDFResult,
} from "@/lib/adobe-pdf-client"
import { Readable } from "stream"
import { Buffer } from "buffer"

export async function POST(request: Request) {
  console.log("[v0] Adobe PDF Services: Starting PDF compression...")

  try {
    const pdfServices = createAdobePDFClient()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const compressionLevel = (formData.get("compressionLevel") as string) || "MEDIUM"

    if (!file) {
      console.error("[v0] Adobe PDF Services: No file provided")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    const originalSize = file.size
    console.log("[v0] Adobe PDF Services: Compressing", file.name)
    console.log("[v0] Adobe PDF Services: Original size:", originalSize, "bytes")
    console.log("[v0] Adobe PDF Services: Compression level:", compressionLevel)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const readableStream = Readable.from(buffer)

    console.log("[v0] Adobe PDF Services: Creating input asset from file...")
    const inputAsset = await pdfServices.upload({
      readStream: readableStream,
      mimeType: MimeType.PDF,
    })

    console.log("[v0] Adobe PDF Services: Input asset created successfully")

    let level = CompressionLevel.MEDIUM
    if (compressionLevel.toUpperCase() === "LOW") {
      level = CompressionLevel.LOW
    } else if (compressionLevel.toUpperCase() === "HIGH") {
      level = CompressionLevel.HIGH
    }

    const params = new CompressPDFParams({ compressionLevel: level })

    console.log("[v0] Adobe PDF Services: Creating compression job...")
    const job = new CompressPDFJob({ inputAsset, params })

    console.log("[v0] Adobe PDF Services: Submitting compression job...")
    const pollingURL = await pdfServices.submit({ job })

    console.log("[v0] Adobe PDF Services: Polling for results...")
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: CompressPDFResult,
    })

    console.log("[v0] Adobe PDF Services: Job completed successfully")
    const resultAsset = pdfServicesResponse.result.asset

    const streamAsset = await pdfServices.getContent({ asset: resultAsset })

    const chunks: Buffer[] = []
    for await (const chunk of streamAsset.readStream) {
      chunks.push(Buffer.from(chunk))
    }
    const resultBuffer = Buffer.concat(chunks)
    const compressedSize = resultBuffer.length

    const compressionRatio = originalSize > 0 ? Math.round(((originalSize - compressedSize) / originalSize) * 100) : 0

    console.log("[v0] Adobe PDF Services: Compression complete")
    console.log("[v0] Adobe PDF Services: Compressed size:", compressedSize, "bytes")
    console.log("[v0] Adobe PDF Services: Saved:", compressionRatio + "%")

    return NextResponse.json({
      success: true,
      compressedPdf: resultBuffer.toString("base64"),
      originalSize,
      compressedSize,
      compressionRatio: compressionRatio + "%",
      fileName: file.name,
    })
  } catch (error) {
    console.error("[v0] Adobe PDF Services: Unexpected error:", error)
    const { message, statusCode } = handleAdobeError(error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to compress PDF",
        details: message,
      },
      { status: statusCode },
    )
  }
}
