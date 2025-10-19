"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Zap } from "lucide-react"

export default function TestZapierPage() {
  const [testing, setTesting] = useState(false)
  const [listingActions, setListingActions] = useState(false)
  const [testingAction, setTestingAction] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [availableActions, setAvailableActions] = useState<any[]>([])

  const [actionName, setActionName] = useState("")
  const [actionParams, setActionParams] = useState("{}")

  const testConnection = async () => {
    setTesting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/zapier/test-connection", {
        method: "GET",
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || "Connection test failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test connection")
    } finally {
      setTesting(false)
    }
  }

  const listActions = async () => {
    setListingActions(true)
    setError(null)
    setAvailableActions([])

    try {
      const response = await fetch("/api/zapier/list-actions", {
        method: "GET",
      })

      const data = await response.json()

      if (data.success) {
        setAvailableActions(data.actions || [])
        setResult(data)
      } else {
        setError(data.message || "Failed to list actions")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list actions")
    } finally {
      setListingActions(false)
    }
  }

  const testAction = async () => {
    setTestingAction(true)
    setError(null)
    setResult(null)

    try {
      const params = JSON.parse(actionParams)

      const response = await fetch("/api/zapier/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zapierAction: actionName,
          zapierParams: params,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || "Action test failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test action")
    } finally {
      setTestingAction(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Zap className="h-8 w-8 text-orange-500" />
          Zapier MCP Test Console
        </h1>
        <p className="text-muted-foreground">Test and debug your Zapier MCP integration</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && !error && (
        <Alert className="mb-6 border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            <pre className="mt-2 text-xs overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Test Connection */}
        <Card>
          <CardHeader>
            <CardTitle>1. Test Connection</CardTitle>
            <CardDescription>Verify that your Zapier MCP API key is configured correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testConnection} disabled={testing} className="w-full">
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* List Available Actions */}
        <Card>
          <CardHeader>
            <CardTitle>2. List Available Actions</CardTitle>
            <CardDescription>Retrieve all Zapier actions configured in your MCP dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={listActions} disabled={listingActions} className="w-full mb-4">
              {listingActions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Actions...
                </>
              ) : (
                "List Available Actions"
              )}
            </Button>

            {availableActions.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Available Actions:</h3>
                <div className="space-y-2">
                  {availableActions.map((action, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{action.id || action.name}</div>
                      <div className="text-sm text-muted-foreground">{action.description || "No description"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Specific Action */}
        <Card>
          <CardHeader>
            <CardTitle>3. Test Specific Action</CardTitle>
            <CardDescription>Execute a specific Zapier action with custom parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="actionName">Action Name</Label>
              <Input
                id="actionName"
                placeholder="e.g., gmail_send_email"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="actionParams">Parameters (JSON)</Label>
              <Textarea
                id="actionParams"
                placeholder='{"to": "example@example.com", "subject": "Test", "body": "Hello"}'
                value={actionParams}
                onChange={(e) => setActionParams(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={testAction} disabled={testingAction || !actionName} className="w-full">
              {testingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Action...
                </>
              ) : (
                "Test Action"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Check the browser console and server logs for detailed debugging information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>
                <strong>Environment Variable:</strong> ZAPIER_MCP_API_KEY
              </p>
              <p>
                <strong>API Endpoint:</strong> /api/zapier/mcp
              </p>
              <p>
                <strong>Documentation:</strong> See ZAPIER_MCP_SETUP_GUIDE.md
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
