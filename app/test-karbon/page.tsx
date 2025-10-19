"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, Loader2, Search, Building2, User } from "lucide-react"

export default function TestKarbonPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Test 1: Connection Test
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [connectionMessage, setConnectionMessage] = useState("")

  // Test 2: Search by ID
  const [karbonClientId, setKarbonClientId] = useState("")
  const [clientType, setClientType] = useState<"individual" | "organization">("individual")
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  // Test 3: Search Contacts/Organizations
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<"contacts" | "organizations">("contacts")
  const [generalSearchResults, setGeneralSearchResults] = useState<any>(null)
  const [generalSearchLoading, setGeneralSearchLoading] = useState(false)

  const testConnection = async () => {
    setConnectionStatus("testing")
    setConnectionMessage("")
    setError(null)

    try {
      console.log("[v0] Testing Karbon connection...")

      // Test by fetching a small number of contacts
      const response = await fetch("/api/karbon/contacts?$top=1")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Karbon connection test successful:", data)

      setConnectionStatus("success")
      setConnectionMessage(`Successfully connected to Karbon API. Found ${data.total || 0} contacts in database.`)
    } catch (err: any) {
      console.error("[v0] Karbon connection test failed:", err)
      setConnectionStatus("error")
      setConnectionMessage(err.message || "Connection failed")
      setError(
        "Failed to connect to Karbon API. Please check your KARBON_API_KEY and KARBON_AUTH_TOKEN environment variables.",
      )
    }
  }

  const searchById = async () => {
    if (!karbonClientId.trim()) {
      setError("Please enter a Karbon Client ID")
      return
    }

    setSearchLoading(true)
    setSearchResults(null)
    setError(null)

    try {
      console.log("[v0] Searching Karbon by ID:", karbonClientId, "Type:", clientType)

      const response = await fetch("/api/karbon/search-by-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          karbonClientId: karbonClientId.trim(),
          clientType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Karbon search results:", data)
      setSearchResults(data)
    } catch (err: any) {
      console.error("[v0] Karbon search failed:", err)
      setError(err.message || "Search failed")
    } finally {
      setSearchLoading(false)
    }
  }

  const searchGeneral = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter a search term")
      return
    }

    setGeneralSearchLoading(true)
    setGeneralSearchResults(null)
    setError(null)

    try {
      console.log("[v0] Searching Karbon:", searchType, "for:", searchTerm)

      const endpoint = searchType === "contacts" ? "/api/karbon/contacts" : "/api/karbon/organizations"
      const response = await fetch(`${endpoint}?searchTerm=${encodeURIComponent(searchTerm.trim())}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Karbon general search results:", data)
      setGeneralSearchResults(data)
    } catch (err: any) {
      console.error("[v0] Karbon general search failed:", err)
      setError(err.message || "Search failed")
    } finally {
      setGeneralSearchLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Karbon API Test Console</h1>
        <p className="text-muted-foreground">
          Test and debug your Karbon integration. Verify credentials, search clients, and inspect API responses.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">Connection Test</TabsTrigger>
          <TabsTrigger value="search-id">Search by ID</TabsTrigger>
          <TabsTrigger value="search-general">Search Contacts/Orgs</TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle>Test Karbon Connection</CardTitle>
              <CardDescription>Verify your Karbon API credentials and database access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testConnection} disabled={connectionStatus === "testing"} className="w-full">
                {connectionStatus === "testing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>

              {connectionStatus === "success" && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{connectionMessage}</AlertDescription>
                </Alert>
              )}

              {connectionStatus === "error" && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{connectionMessage}</AlertDescription>
                </Alert>
              )}

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Environment Variables Required:</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code className="bg-background px-2 py-1 rounded">KARBON_API_KEY</code>
                  </li>
                  <li>
                    <code className="bg-background px-2 py-1 rounded">KARBON_AUTH_TOKEN</code>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search-id">
          <Card>
            <CardHeader>
              <CardTitle>Search by Karbon Client ID</CardTitle>
              <CardDescription>
                Look up a specific client using their Karbon ContactKey or OrganizationKey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="karbon-id">Karbon Client ID</Label>
                <Input
                  id="karbon-id"
                  placeholder="e.g., 12345678-1234-1234-1234-123456789abc"
                  value={karbonClientId}
                  onChange={(e) => setKarbonClientId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-type">Client Type</Label>
                <Select value={clientType} onValueChange={(value: any) => setClientType(value)}>
                  <SelectTrigger id="client-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual (Contact)</SelectItem>
                    <SelectItem value="organization">Organization (Entity)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={searchById} disabled={searchLoading} className="w-full">
                {searchLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search by ID
                  </>
                )}
              </Button>

              {searchResults && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">
                      Found {searchResults.total} result(s) from {searchResults.source.join(", ")}
                    </span>
                  </div>

                  {searchResults.contact && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="font-semibold">Name:</dt>
                            <dd>{searchResults.contact.FullName || searchResults.contact.DisplayName}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">Email:</dt>
                            <dd>{searchResults.contact.EmailAddress || "N/A"}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">Contact Key:</dt>
                            <dd>
                              <code className="text-xs">{searchResults.contact.ContactKey}</code>
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  )}

                  {searchResults.organization && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Organization Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="font-semibold">Name:</dt>
                            <dd>{searchResults.organization.DisplayName || searchResults.organization.LegalName}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">Organization Key:</dt>
                            <dd>
                              <code className="text-xs">{searchResults.organization.OrganizationKey}</code>
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  )}

                  {searchResults.workItems && searchResults.workItems.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Work Items ({searchResults.workItems.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {searchResults.workItems.slice(0, 5).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="font-semibold">{item.Title || "Untitled"}</div>
                              <div className="text-sm text-muted-foreground">
                                Status: <Badge variant="outline">{item.Status || "Unknown"}</Badge>
                              </div>
                            </div>
                          ))}
                          {searchResults.workItems.length > 5 && (
                            <p className="text-sm text-muted-foreground">
                              ...and {searchResults.workItems.length - 5} more
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <details className="mt-4">
                    <summary className="cursor-pointer font-semibold text-sm">View Raw JSON Response</summary>
                    <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">
                      {JSON.stringify(searchResults, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search-general">
          <Card>
            <CardHeader>
              <CardTitle>Search Contacts or Organizations</CardTitle>
              <CardDescription>Search for clients by name or other criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-type">Search In</Label>
                <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                  <SelectTrigger id="search-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacts">Contacts (Individuals)</SelectItem>
                    <SelectItem value="organizations">Organizations (Entities)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-term">Search Term</Label>
                <Input
                  id="search-term"
                  placeholder="Enter name or search term..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button onClick={searchGeneral} disabled={generalSearchLoading} className="w-full">
                {generalSearchLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>

              {generalSearchResults && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Found {generalSearchResults.total} result(s)</span>
                  </div>

                  {generalSearchResults.results && generalSearchResults.results.length > 0 && (
                    <div className="space-y-2">
                      {generalSearchResults.results.slice(0, 10).map((result: any, idx: number) => (
                        <Card key={idx}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold flex items-center gap-2">
                                  {searchType === "contacts" ? (
                                    <User className="h-4 w-4" />
                                  ) : (
                                    <Building2 className="h-4 w-4" />
                                  )}
                                  {result.name}
                                </div>
                                {result.email && (
                                  <div className="text-sm text-muted-foreground mt-1">{result.email}</div>
                                )}
                                {result.phone && <div className="text-sm text-muted-foreground">{result.phone}</div>}
                              </div>
                              <Badge variant="outline">{result.id ? "Has ID" : "No ID"}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {generalSearchResults.results.length > 10 && (
                        <p className="text-sm text-muted-foreground">
                          ...and {generalSearchResults.results.length - 10} more
                        </p>
                      )}
                    </div>
                  )}

                  <details className="mt-4">
                    <summary className="cursor-pointer font-semibold text-sm">View Raw JSON Response</summary>
                    <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">
                      {JSON.stringify(generalSearchResults, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
