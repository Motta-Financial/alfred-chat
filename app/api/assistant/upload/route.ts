import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] Starting file upload...")

  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const assistantId = formData.get("assistantId") as string
    const vectorStoreId = formData.get("vectorStoreId") as string

    if (!file || !assistantId || !vectorStoreId) {
      return NextResponse.json({ error: "File, assistantId, and vectorStoreId required" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", file.name, "Size:", file.size)

    const uploadFormData = new FormData()
    uploadFormData.append("file", file)
    uploadFormData.append("purpose", "assistants")

    const uploadResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("[v0] File upload error:", errorText)
      return NextResponse.json({ error: `Upload failed: ${errorText}` }, { status: uploadResponse.status })
    }

    const uploadedFile = await uploadResponse.json()
    console.log("[v0] File uploaded:", uploadedFile.id)

    const vectorStoreFileResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        file_id: uploadedFile.id,
      }),
    })

    if (!vectorStoreFileResponse.ok) {
      const errorText = await vectorStoreFileResponse.text()
      console.error("[v0] Vector store file add error:", errorText)
      return NextResponse.json({ error: `Failed to add file to vector store: ${errorText}` }, { status: 500 })
    }

    const vectorStoreFile = await vectorStoreFileResponse.json()
    console.log("[v0] File added to vector store:", vectorStoreFile.id)

    return NextResponse.json({
      success: true,
      fileId: uploadedFile.id,
      filename: file.name,
      vectorStoreFileId: vectorStoreFile.id,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
