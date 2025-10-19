"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, Download, CheckCircle, XCircle, Shield } from "lucide-react"

export default function TestAdobePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [operation, setOperation] = useState<"extract" | "compress" | "combine" | "convert">("extract")
  const [compressionLevel, setCompressionLevel] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM")
  const [convertFormat, setConvertFormat] = useState<"docx" | "xlsx" | "pptx" | "jpeg" | "png">("docx")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [credentialsStatus, setCredentialsStatus] = useState<any>(null)
  const [testingCredentials, setTestingCredentials] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError(null)
      setResult(null)
    }
  }

  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
      setError(null)
      setResult(null)
    }
  }

  const testExtract = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("[v0] Testing Adobe PDF Extract API...")
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/adobe/extract", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("[v0] Extract API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract PDF content")
      }

      setResult(data)
    } catch (err: any) {
      console.error("[v0] Extract API error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testCompress = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("[v0] Testing Adobe PDF Compress API...")
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("compressionLevel", compressionLevel)

      const response = await fetch("/api/adobe/compress", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("[v0] Compress API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to compress PDF")
      }

      setResult(data)
    } catch (err: any) {
      console.error("[v0] Compress API error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testCombine = async () => {
    if (selectedFiles.length < 2) {
      setError("Please select at least 2 PDF files to combine")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("[v0] Testing Adobe PDF Combine API...")
      const formData = new FormData()
      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch("/api/adobe/combine", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("[v0] Combine API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to combine PDFs")
      }

      setResult(data)
    } catch (err: any) {
      console.error("[v0] Combine API error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testConvert = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("[v0] Testing Adobe PDF Convert API...")
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("format", convertFormat)

      const response = await fetch("/api/adobe/convert", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("[v0] Convert API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert PDF")
      }

      setResult(data)
    } catch (err: any) {
      console.error("[v0] Convert API error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testCredentials = async () => {
    setTestingCredentials(true)
    setCredentialsStatus(null)

    try {
      console.log("[v0] Testing Adobe PDF Services credentials...")
      const response = await fetch("/api/adobe/test-credentials")
      const data = await response.json()
      console.log("[v0] Credentials test result:", data)
      setCredentialsStatus(data)
    } catch (err: any) {
      console.error("[v0] Credentials test error:", err)
      setCredentialsStatus({
        success: false,
        error: err.message,
      })
    } finally {
      setTestingCredentials(false)
    }
  }

  const handleTest = async () => {
    switch (operation) {
      case "extract":
        await testExtract()
        break
      case "compress":
        await testCompress()
        break
      case "combine":
        await testCombine()
        break
      case "convert":
        await testConvert()
        break
    }
  }

  const downloadResult = () => {
    if (result?.downloadUrl) {
      window.open(result.downloadUrl, "_blank")
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Adobe PDF Services API Test</h1>
        <p className="text-muted-foreground">Test and debug Adobe PDF Services integration</p>
      </div>

      {/* Test Credentials Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Test Credentials
          </CardTitle>
          <CardDescription>Verify your Adobe PDF Services API credentials are configured correctly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testCredentials} disabled={testingCredentials} className="w-full">
            {testingCredentials ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Test API Credentials
              </>
            )}
          </Button>

          {credentialsStatus && (
            <Alert variant={credentialsStatus.success ? "default" : "destructive"}>
              {credentialsStatus.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {credentialsStatus.success ? "Credentials Valid!" : "Credentials Issue"}
                  </p>
                  <p className="text-sm">{credentialsStatus.message || credentialsStatus.error}</p>
                  {credentialsStatus.troubleshooting && (
                    <ul className="text-sm list-disc list-inside mt-2">
                      {credentialsStatus.troubleshooting.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Select Operation Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Operation</CardTitle>
          <CardDescription>Choose which Adobe PDF API to test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operation">Operation</Label>
            <Select value={operation} onValueChange={(value: any) => setOperation(value)}>
              <SelectTrigger id="operation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extract">Extract Text & Data</SelectItem>
                <SelectItem value="compress">Compress PDF</SelectItem>
                <SelectItem value="combine">Combine PDFs</SelectItem>
                <SelectItem value="convert">Convert PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {operation === "compress" && (
            <div className="space-y-2">
              <Label htmlFor="compression">Compression Level</Label>
              <Select value={compressionLevel} onValueChange={(value: any) => setCompressionLevel(value)}>
                <SelectTrigger id="compression">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low (Better Quality)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (Balanced)</SelectItem>
                  <SelectItem value="HIGH">High (Smaller Size)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === "convert" && (
            <div className="space-y-2">
              <Label htmlFor="format">Convert To</Label>
              <Select value={convertFormat} onValueChange={(value: any) => setConvertFormat(value)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="docx">Word (.docx)</SelectItem>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pptx">PowerPoint (.pptx)</SelectItem>
                  <SelectItem value="jpeg">JPEG Image</SelectItem>
                  <SelectItem value="png">PNG Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === "combine" ? (
            <div className="space-y-2">
              <Label htmlFor="files">Select PDF Files (2 or more)</Label>
              <Input id="files" type="file" accept=".pdf" multiple onChange={handleMultipleFilesChange} />
              {selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">{selectedFiles.length} file(s) selected</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="file">Select PDF File</Label>
              <Input id="file" type="file" accept=".pdf" onChange={handleFileChange} />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleTest}
            disabled={loading || (operation === "combine" ? selectedFiles.length < 2 : !selectedFile)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Test {operation.charAt(0).toUpperCase() + operation.slice(1)} API
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Success
            </CardTitle>
            <CardDescription>Operation completed successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.extractedText && (
              <div className="space-y-2">
                <Label>Extracted Text (first 500 chars)</Label>
                <div className="p-4 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {result.extractedText.substring(0, 500)}
                  {result.extractedText.length > 500 && "..."}
                </div>
              </div>
            )}

            {result.tables && result.tables.length > 0 && (
              <div className="space-y-2">
                <Label>Tables Found: {result.tables.length}</Label>
              </div>
            )}

            {result.images && result.images.length > 0 && (
              <div className="space-y-2">
                <Label>Images Found: {result.images.length}</Label>
              </div>
            )}

            {result.originalSize && (
              <div className="space-y-2">
                <Label>Original Size</Label>
                <p className="text-sm">{(result.originalSize / 1024).toFixed(2)} KB</p>
              </div>
            )}

            {result.compressedSize && (
              <div className="space-y-2">
                <Label>Compressed Size</Label>
                <p className="text-sm">{(result.compressedSize / 1024).toFixed(2)} KB</p>
              </div>
            )}

            {result.compressionRatio && (
              <div className="space-y-2">
                <Label>Compression Ratio</Label>
                <p className="text-sm">{result.compressionRatio}</p>
              </div>
            )}

            {result.downloadUrl && (
              <Button onClick={downloadResult} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Result
              </Button>
            )}

            <div className="space-y-2">
              <Label>Full Response</Label>
              <div className="p-4 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                {JSON.stringify(result, null, 2)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
