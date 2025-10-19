"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Send,
  Sparkles,
  Bot,
  FileText,
  Search,
  Calculator,
  Users,
  Zap,
  AlertCircle,
  Upload,
  LogOut,
} from "lucide-react"
import Image from "next/image"
import TextareaAutosize from "react-textarea-autosize"
import { MarkdownMessage } from "@/components/markdown-message"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

type Agent = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

const agents: Agent[] = [
  {
    id: "tax-research",
    name: "Tax Research Agent",
    description:
      "Federal and state tax research platform for CPAs. Provides detailed, accurate tax information with examples.",
    icon: <FileText className="w-5 h-5" />,
    color: "bg-blue-500",
  },
  {
    id: "contact-research",
    name: "Contact Research Agent",
    description:
      "Searches business platforms for client information and meeting debriefs to provide comprehensive summaries.",
    icon: <Search className="w-5 h-5" />,
    color: "bg-purple-500",
  },
  {
    id: "financial-calculator",
    name: "Financial Calculator Agent",
    description: "Advanced calculations for tax planning, retirement projections, and financial modeling.",
    icon: <Calculator className="w-5 h-5" />,
    color: "bg-green-500",
  },
  {
    id: "client-insights",
    name: "Client Insights Agent",
    description: "Analyzes client data to provide actionable insights and recommendations for better service delivery.",
    icon: <Users className="w-5 h-5" />,
    color: "bg-orange-500",
  },
]

export default function AlfredChat() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Good day. I am ALFRED, your Virtual AI Butler at Motta Financial. How may I assist you with your tax research, client communications, or practice management needs today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeView, setActiveView] = useState<"chat" | "agents">("chat")
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [assistantId, setAssistantId] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const initAssistant = async () => {
      console.log("[v0] Initializing ALFRED assistant...")
      setIsInitializing(true)

      try {
        // Create or get assistant
        console.log("[v0] Creating assistant...")
        const assistantRes = await fetch("/api/assistant/create", {
          method: "POST",
        })

        console.log("[v0] Assistant response status:", assistantRes.status)

        if (!assistantRes.ok) {
          const errorData = await assistantRes.json()
          console.error("[v0] Assistant creation failed:", errorData)
          throw new Error(errorData.error || "Failed to create assistant")
        }

        const { assistantId: newAssistantId } = await assistantRes.json()
        console.log("[v0] Assistant created:", newAssistantId)
        setAssistantId(newAssistantId)

        // Create thread
        console.log("[v0] Creating thread...")
        const threadRes = await fetch("/api/assistant/thread", {
          method: "POST",
        })

        console.log("[v0] Thread response status:", threadRes.status)

        if (!threadRes.ok) {
          const errorData = await threadRes.json()
          console.error("[v0] Thread creation failed:", errorData)
          throw new Error(errorData.error || "Failed to create thread")
        }

        const { threadId: newThreadId } = await threadRes.json()
        console.log("[v0] Thread created:", newThreadId)
        setThreadId(newThreadId)

        console.log("[v0] Initialization complete!")
        setInitError(null)
      } catch (error) {
        console.error("[v0] Initialization error:", error)
        setInitError(error instanceof Error ? error.message : "Failed to initialize ALFRED")
      } finally {
        setIsInitializing(false)
      }
    }

    initAssistant()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress
      if (email && !email.endsWith("@mottafinancial.com")) {
        // Redirect to sign-in with error
        signOut().then(() => {
          router.push("/sign-in?error=unauthorized_domain")
        })
      }
    }
  }, [isLoaded, user, signOut, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !assistantId || !threadId) {
      return
    }

    console.log("[v0] Sending message:", input.trim())

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const assistantMessageId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ])

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          assistantId,
          message: userMessage.content,
        }),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error:", errorData)
        throw new Error(errorData.error || "Failed to get response")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      const decoder = new TextDecoder()
      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log("[v0] Stream complete, total length:", accumulatedContent.length)
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                accumulatedContent += data.content
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m)),
                )
              }
            } catch (e) {
              console.error("[v0] Parse error:", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `My apologies, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (text: string) => {
    setInput(text)
  }

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId)
    const agent = agents.find((a) => a.id === agentId)
    if (agent) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `You've activated the ${agent.name}. ${agent.description} How may I assist you?`,
        },
      ])
      setActiveView("chat")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !assistantId) return

    console.log("[v0] Starting file upload:", file.name)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("assistantId", assistantId)

      const response = await fetch("/api/assistant/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await response.json()
      console.log("[v0] File uploaded successfully:", data)

      setUploadedFiles((prev) => [...prev, { id: data.fileId, name: data.filename }])

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `I have successfully added "${data.filename}" to my knowledge base. I can now reference this document in our conversations.`,
        },
      ])
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `My apologies, I encountered an error uploading the file: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ])
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center glass-card tech-glow">
          <div className="mb-6 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 animate-ping" />
            </div>
            <Image
              src="/alfred-logo-original.png"
              alt="ALFRED AI"
              width={96}
              height={96}
              className="object-contain mx-auto relative z-10 animate-pulse"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>
          <h2 className="text-2xl font-semibold mb-3 tracking-tight">Initializing ALFRED</h2>
          <p className="text-muted-foreground text-sm mb-2 font-medium">
            Your AI-Powered Practice Management Assistant
          </p>
          <p className="text-muted-foreground text-xs mb-6 leading-relaxed">
            Connecting to Airtable, Karbon, and OpenAI to provide comprehensive client research, meeting debriefs, and
            intelligent automation for Motta Financial
          </p>
          <div className="flex justify-center gap-1.5 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="animate-pulse">Loading client database...</p>
            <p className="animate-pulse" style={{ animationDelay: "200ms" }}>
              Connecting to Karbon API...
            </p>
            <p className="animate-pulse" style={{ animationDelay: "400ms" }}>
              Initializing AI assistant...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md glass-card">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Initialization Error</h2>
              <p className="text-muted-foreground text-sm mb-4">{initError}</p>
              <div className="bg-muted p-3 rounded text-xs font-mono mb-4">
                <p className="font-semibold mb-2">Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check that OPENAI_API_KEY is set in environment variables</li>
                  <li>Verify the API key is valid and has credits</li>
                  <li>Check browser console for detailed error logs</li>
                </ul>
              </div>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-1 rounded-lg bg-primary/5">
              <Image
                src="/alfred-logo-original.png"
                alt="ALFRED AI"
                width={50}
                height={50}
                className="object-contain"
                style={{ mixBlendMode: "multiply" }}
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">ALFRED AI</h1>
              <p className="text-xs text-muted-foreground font-medium">Motta Financial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 mr-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{user.fullName || user.firstName}</p>
                  <p className="text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            )}
            <Button
              variant={activeView === "chat" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("chat")}
              className="gap-2"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button
              variant={activeView === "agents" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("agents")}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Agent Kit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !assistantId}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.pdf,.doc,.docx,.md"
              className="hidden"
            />
          </div>
        </div>
        {uploadedFiles.length > 0 && (
          <div className="container mx-auto px-4 py-2 border-t border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Knowledge Base:</span>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                >
                  <FileText className="w-3 h-3" />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {activeView === "chat" ? (
        <>
          <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl overflow-y-auto">
            <div className="space-y-6 mb-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 p-1 digital-border">
                      <Image
                        src="/alfred-logo-original.png"
                        alt="ALFRED"
                        width={36}
                        height={36}
                        className="object-contain"
                        style={{ mixBlendMode: "multiply" }}
                      />
                    </div>
                  )}
                  <Card
                    className={`px-4 py-3 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "glass-card digital-border"
                    }`}
                  >
                    <MarkdownMessage content={message.content} isUser={message.role === "user"} />
                  </Card>
                  {message.role === "user" && (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 digital-border">
                      <span className="text-sm font-medium text-muted-foreground">You</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 tech-glow">
                    <Sparkles className="w-5 h-5 text-primary-foreground animate-pulse" />
                  </div>
                  <Card className="px-4 py-3 glass-card digital-border">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3 font-medium">How may I assist you today?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3 px-4 text-left hover:bg-primary/10 hover:border-primary glass-card hover:tech-glow transition-all bg-transparent"
                    onClick={() => handleQuickAction("Tell me about tax planning services")}
                  >
                    <div>
                      <div className="font-medium text-sm">Tax Planning</div>
                      <div className="text-xs text-muted-foreground">Strategic tax optimization</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3 px-4 text-left hover:bg-primary/10 hover:border-primary glass-card hover:tech-glow transition-all bg-transparent"
                    onClick={() => handleQuickAction("How can ALFRED AI help my business?")}
                  >
                    <div>
                      <div className="font-medium text-sm">ALFRED AI Platform</div>
                      <div className="text-xs text-muted-foreground">Learn about our technology</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3 px-4 text-left hover:bg-primary/10 hover:border-primary glass-card hover:tech-glow transition-all bg-transparent"
                    onClick={() => handleQuickAction("What financial planning services do you offer?")}
                  >
                    <div>
                      <div className="font-medium text-sm">Financial Planning</div>
                      <div className="text-xs text-muted-foreground">Comprehensive wealth strategies</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3 px-4 text-left hover:bg-primary/10 hover:border-primary glass-card hover:tech-glow transition-all bg-transparent"
                    onClick={() => handleQuickAction("Show me the agent kit")}
                  >
                    <div>
                      <div className="font-medium text-sm">Agent Kit</div>
                      <div className="text-xs text-muted-foreground">Explore specialized agents</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </main>

          <footer className="border-t border-border bg-card/80 backdrop-blur-md shadow-lg">
            <div className="container mx-auto px-4 py-4 max-w-4xl">
              <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <TextareaAutosize
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask ALFRED about accounting, tax, or financial services..."
                  className="flex-1 glass-card digital-border resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[36px] max-h-[200px]"
                  disabled={isLoading}
                  minRows={1}
                  maxRows={8}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="flex-shrink-0 tech-glow"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="mt-3 text-xs text-muted-foreground text-center">
                <p className="font-medium">Tech-forward. Efficient. Professional.</p>
              </div>
            </div>
          </footer>
        </>
      ) : (
        <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">ALFRED Agent Kit</h2>
            <p className="text-muted-foreground">
              Specialized AI agents designed for Motta Financial professionals. Each agent is trained for specific tasks
              to enhance efficiency and service delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer glass-card digital-border hover:tech-glow hover:border-primary/50"
                onClick={() => handleAgentSelect(agent.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`${agent.color} p-3 rounded-lg text-white flex-shrink-0`}>{agent.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>
                    <Button variant="outline" size="sm" className="mt-4 gap-2 bg-transparent">
                      <Zap className="w-3 h-3" />
                      Activate Agent
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-6 p-6 glass-card digital-border tech-glow">
            <div className="flex items-start gap-4">
              <div className="bg-primary p-3 rounded-lg text-primary-foreground flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Custom Agent Development</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Need a specialized agent for your workflow? ALFRED can be customized to create new agents tailored to
                  your specific needs. Contact the development team to discuss custom agent creation.
                </p>
                <Button variant="default" size="sm">
                  Request Custom Agent
                </Button>
              </div>
            </div>
          </Card>
        </main>
      )}
    </div>
  )
}
