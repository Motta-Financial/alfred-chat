"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Search, FileText, Database } from "lucide-react"

export default function TestAirtablePage() {
  const [loading, setLoading] = useState(false)
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("David Rokeach")
  const [searchResult, setSearchResult] = useState<any>(null)
  const [clientNumber, setClientNumber] = useState("")
  const [debriefResult, setDebriefResult] = useState<any>(null)

  const testConnection = async () => {
    setLoading(true)
    setConnectionResult(null)
    console.log("[v0] Testing Airtable connection...")

    try {
      const response = await fetch("/api/airtable/test")
      const data = await response.json()

      console.log("[v0] Connection test result:", data)
      setConnectionResult(data)
    } catch (error) {
      console.error("[v0] Connection test error:", error)
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const searchClient = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    setSearchResult(null)
    console.log("[v0] Searching for client:", searchTerm)

    try {
      const response = await fetch("/api/airtable/search-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm }),
      })

      const data = await response.json()
      console.log("[v0] Search result:", data)
      setSearchResult(data)

      // Auto-populate client number if found
      if (data.clients && data.clients.length > 0 && data.clients[0].clientNumber) {
        setClientNumber(data.clients[0].clientNumber)
      }
    } catch (error) {
      console.error("[v0] Search error:", error)
      setSearchResult({
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const getMeetingDebriefs = async () => {
    if (!clientNumber.trim()) return

    setLoading(true)
    setDebriefResult(null)
    console.log("[v0] Getting meeting debriefs for client number:", clientNumber)

    try {
      const response = await fetch("/api/airtable/get-meeting-debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientNumber }),
      })

      const data = await response.json()
      console.log("[v0] Meeting debriefs result:", data)
      setDebriefResult(data)
    } catch (error) {
      console.error("[v0] Meeting debriefs error:", error)
      setDebriefResult({
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Airtable Integration Test Console</h1>
        <p className="text-muted-foreground">Test and debug the Airtable connection for ALFRED Assistant</p>
      </div>

      {/* Connection Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Step 1: Test Connection
          </CardTitle>
          <CardDescription>Verify Airtable credentials and database access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Test Airtable Connection
              </>
            )}
          </Button>

          {connectionResult && (
            <Alert variant={connectionResult.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {connectionResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      {connectionResult.success ? "Connection Successful!" : "Connection Failed"}
                    </div>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(connectionResult, null, 2)}
                    </pre>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Client Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Step 2: Search Client
          </CardTitle>
          <CardDescription>Search for clients by name or organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchTerm">Search Term</Label>
            <Input
              id="searchTerm"
              placeholder="Enter client name (e.g., David Rokeach)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchClient()}
            />
          </div>

          <Button onClick={searchClient} disabled={loading || !searchTerm.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Client
              </>
            )}
          </Button>

          {searchResult && (
            <Alert variant={searchResult.error ? "destructive" : "default"}>
              <div className="flex items-start gap-2">
                {searchResult.error ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    {searchResult.error ? (
                      <div>
                        <div className="font-semibold mb-2">Search Failed</div>
                        <div className="text-sm">{searchResult.error}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold mb-2">
                          Found {searchResult.count} client{searchResult.count !== 1 ? "s" : ""}
                        </div>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                          {JSON.stringify(searchResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Meeting Debriefs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Step 3: Get Meeting Debriefs
          </CardTitle>
          <CardDescription>Retrieve meeting history for a client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientNumber">Client Number</Label>
            <Input
              id="clientNumber"
              placeholder="Enter client number (auto-filled from search)"
              value={clientNumber}
              onChange={(e) => setClientNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && getMeetingDebriefs()}
            />
          </div>

          <Button onClick={getMeetingDebriefs} disabled={loading || !clientNumber.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Debriefs...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Get Meeting Debriefs
              </>
            )}
          </Button>

          {debriefResult && (
            <Alert variant={debriefResult.error ? "destructive" : "default"}>
              <div className="flex items-start gap-2">
                {debriefResult.error ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    {debriefResult.error ? (
                      <div>
                        <div className="font-semibold mb-2">Failed to Load Debriefs</div>
                        <div className="text-sm">{debriefResult.error}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold mb-2">
                          Found {debriefResult.count} meeting debrief{debriefResult.count !== 1 ? "s" : ""}
                        </div>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                          {JSON.stringify(debriefResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="mt-6 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Check browser console for detailed [v0] logs</div>
            <div>Base ID and Table ID are configured in the API routes</div>
            <div>AIRTABLE_PERSONAL_ACCESS_TOKEN must be set in environment variables</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
