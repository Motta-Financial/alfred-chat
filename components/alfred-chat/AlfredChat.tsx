"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isTextUIPart, isToolUIPart, type UIMessage } from "ai"
import { ArrowUp, Database, Folder, Mail, Scale, Square, UserSearch } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { MarkdownMessage } from "@/components/markdown-message"
import { createClient } from "@/lib/supabase/client"
import { getBearerToken, HUB_CHAT_URL, assertHubConfigured } from "@/lib/hub"
import { ModelSelector, type ModelCatalog } from "@/components/alfred-chat/ModelSelector"
import { DeepThinkToggle, useDeepThink } from "@/components/alfred-chat/DeepThinkToggle"
import { AUTO_MODEL_ID, DEFAULT_MODEL_ID, getModelById, routeAutoModel } from "@/lib/models"
import { cn } from "@/lib/utils"
import type { SupabaseClient } from "@supabase/supabase-js"

type ConversationId = string | null

interface AlfredChatProps {
  conversationId: ConversationId
  /** Project this chat belongs to; sent to the Hub so it can inject the
   *  project's instructions & knowledge into the system prompt. */
  projectId?: string | null
  projectName?: string | null
  onConversationId: (id: string) => void
  onOpenProject?: () => void
  initialMessages?: UIMessage[]
  /** Owned by ChatPage so navigation remounts don't refetch the catalog. */
  modelCatalog: ModelCatalog
}

function makeTransport(
  supabase: SupabaseClient,
  getConversationId: () => ConversationId,
  getModelId: () => string,
  // Returns true when "Deep think" is on AND the resolved model
  // supports it. Threaded through as a getter (not a value) so the
  // transport closure always reads the latest state without forcing a
  // transport recreation on every toggle.
  getThink: () => boolean,
  getProjectId: () => string | null,
) {
  return new DefaultChatTransport({
    api: HUB_CHAT_URL,
    credentials: "omit",
    headers: async () => {
      assertHubConfigured()
      const token = await getBearerToken(supabase)
      return { Authorization: `Bearer ${token}` }
    },
    body: () => {
      const id = getConversationId()
      const think = getThink()
      const projectId = getProjectId()
      return {
        audience: "staff",
        model: getModelId(),
        // Only send `think` when on. The Hub treats `null` and `false`
        // identically (no thinking), so omitting in the false case
        // keeps the wire format minimal and matches what older clients
        // send.
        ...(think ? { think: true } : {}),
        ...(id ? { conversationId: id } : {}),
        ...(projectId ? { projectId } : {}),
      }
    },
  })
}

/** Serif "A" seal — ALFRED's mark. Aura ring animates while thinking. */
function Monogram({ size = "md", thinking = false }: { size?: "md" | "lg"; thinking?: boolean }) {
  const dims = size === "lg" ? "h-16 w-16" : "h-7 w-7"
  const glyph = size === "lg" ? "text-[28px]" : "text-[13px]"
  return (
    <div className={cn("relative flex-shrink-0", dims)}>
      <div
        className={cn(
          "absolute -inset-1.5 rounded-full bg-sage/50 blur-md",
          thinking ? "animate-aura" : size === "lg" ? "animate-aura opacity-40" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-ink ring-1 ring-brass/40",
          dims,
        )}
      >
        <span className={cn("font-display leading-none text-ivory", glyph)}>A</span>
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  { icon: Mail, label: "Draft a client email", prefill: "Draft an email to a client about " },
  { icon: Scale, label: "Research a tax question", prefill: "Research the tax treatment of " },
  { icon: UserSearch, label: "Summarize a client", prefill: "Give me a status summary for " },
]

export function AlfredChat({
  conversationId,
  projectId = null,
  projectName = null,
  onConversationId,
  onOpenProject,
  initialMessages,
  modelCatalog,
}: AlfredChatProps) {
  // Keep conversationId in a ref so the transport closure always reads the latest value
  // without needing to recreate the transport on every render.
  const conversationIdRef = useRef<ConversationId>(conversationId)
  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  const projectIdRef = useRef<string | null>(projectId)
  useEffect(() => {
    projectIdRef.current = projectId
  }, [projectId])

  const { models, selectedId: selectedModelId, setSelectedId: setSelectedModelId } = modelCatalog
  const modelIdRef = useRef<string>(selectedModelId)
  useEffect(() => {
    modelIdRef.current = selectedModelId
  }, [selectedModelId])

  // The CONCRETE model id sent to the Hub for the in-flight request.
  // When "Auto" is selected, handleSend resolves it per prompt via
  // routeAutoModel() right before sendMessage — the Hub never sees the
  // virtual auto id (it validates body.model against real gateway ids).
  const sendModelRef = useRef<string>(
    selectedModelId === AUTO_MODEL_ID ? DEFAULT_MODEL_ID : selectedModelId,
  )
  // Label of the model Auto last routed to, for the console indicator.
  const [routedLabel, setRoutedLabel] = useState<string | null>(null)

  // The live catalog (models) can grow after the Hub fetch resolves, so
  // it's ref'd like the other transport-closure inputs above rather than
  // captured once at the (one-time) transportRef init below.
  const modelsRef = useRef(models)
  useEffect(() => {
    modelsRef.current = models
  }, [models])

  // Deep-think toggle. The capability check happens inside the getter
  // so a stale toggle state with a non-thinking model still sends
  // `think: false` -- the Hub's own capability check is the
  // authoritative gate, this is just a UX nicety so the toggle
  // visibly disables.
  const [deepThink, setDeepThink] = useDeepThink()
  const deepThinkRef = useRef<boolean>(deepThink)
  useEffect(() => {
    deepThinkRef.current = deepThink
  }, [deepThink])

  // Whether the currently-selected model supports thinking at all.
  // Read off the capability flags in lib/models.ts. Drives the
  // disabled state of <DeepThinkToggle/>.
  const currentModel = getModelById(models, selectedModelId)
  const thinkingAllowed = currentModel.capabilities.supportsThinking

  const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null)
  if (!transportRef.current) {
    transportRef.current = makeTransport(
      createClient(),
      () => conversationIdRef.current,
      // Always the resolved concrete id (Auto → routed model).
      () => sendModelRef.current,
      // Gate `think` on the capability of whichever model is actually
      // used at send time. Belt and suspenders -- the Hub does the
      // same check and ignores the field on unsupported models.
      () =>
        deepThinkRef.current &&
        getModelById(modelsRef.current, sendModelRef.current).capabilities.supportsThinking,
      () => projectIdRef.current,
    )
  }

  const { messages, setMessages, sendMessage, stop, status } = useChat({
    transport: transportRef.current,
    messages: initialMessages,
    onData(part) {
      // Hub emits { type: 'data-conversation', id: <uuid> }. onData fires
      // once per data part (not with an array of them).
      if (part.type === "data-conversation") {
        const id = (part as { type: string; id?: string }).id
        if (id) onConversationId(id)
      }
    },
  })

  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isStreaming = status === "streaming" || status === "submitted"

  // Time-aware greeting, resolved after mount so the server-rendered HTML
  // (whose clock/timezone differs from the visitor's) never mismatches.
  const [greeting, setGreeting] = useState("Hello")
  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening")
  }, [])

  // Auto-scroll to bottom when messages change. Instant while streaming —
  // a smooth scroll per token fights the next token's scroll and janks.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" })
  }, [messages, isStreaming])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Reset messages when initialMessages prop changes: hydrate on
  // conversation switch, clear on "New chat" (undefined).
  useEffect(() => {
    setMessages(initialMessages ?? [])
  }, [initialMessages, setMessages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    // Resolve the model for THIS message. Auto routes per prompt; a
    // concrete selection passes straight through.
    const selected = modelIdRef.current
    if (selected === AUTO_MODEL_ID) {
      const routed = routeAutoModel(text, modelsRef.current, deepThinkRef.current)
      sendModelRef.current = routed.id
      setRoutedLabel(routed.label)
    } else {
      sendModelRef.current = selected
      setRoutedLabel(null)
    }

    setInput("")
    await sendMessage({ text })
  }, [input, isStreaming, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col bg-paper">
      {/* Project context banner */}
      {projectName && (
        <button
          onClick={onOpenProject}
          className="flex items-center gap-2 border-b border-line bg-sage/10 px-5 py-2 text-left transition-colors hover:bg-sage/20"
          title="Open project"
        >
          <Folder className="h-3.5 w-3.5 flex-shrink-0 text-moss" />
          <span className="truncate text-xs font-medium text-moss-deep">{projectName}</span>
          <span className="text-xs text-moss-deep/50">
            — project instructions &amp; knowledge apply
          </span>
        </button>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto w-full max-w-3xl px-5 sm:px-8",
            isEmpty ? "flex h-full flex-col items-center justify-center pb-24" : "py-8",
          )}
        >
          {isEmpty && (
            <div className="animate-msg-in flex flex-col items-center text-center">
              <Monogram size="lg" />
              <h1 className="mt-6 font-display text-[34px] font-light leading-tight tracking-tight text-foreground">
                {greeting}.
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {projectName
                  ? `Start a conversation in ${projectName} — its instructions and knowledge apply.`
                  : "I have the Motta Hub at hand. How may I be of service?"}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {SUGGESTIONS.map(({ icon: Icon, label, prefill }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setInput(prefill)
                      inputRef.current?.focus()
                    }}
                    className="flex items-center gap-2 rounded-full border border-line bg-paper-2 px-3.5 py-2 text-xs font-medium text-foreground/70 transition-all hover:border-sage/60 hover:text-foreground hover:shadow-console"
                  >
                    <Icon className="h-3.5 w-3.5 text-moss" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isEmpty && (
            <div className="space-y-7">
              {messages.map((message) => (
                <MessageRow key={message.id} message={message} />
              ))}

              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="animate-msg-in flex items-center gap-3">
                  <Monogram thinking />
                  <span className="shimmer-text text-sm font-medium">Considering…</span>
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input console */}
      <div className="flex-shrink-0 px-4 pb-4 pt-1 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="shadow-console rounded-2xl border border-line bg-paper-2 transition-all focus-within:border-sage/60 focus-within:ring-4 focus-within:ring-sage/15">
            <TextareaAutosize
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ALFRED…"
              minRows={1}
              maxRows={8}
              disabled={isStreaming}
              className="w-full resize-none bg-transparent px-4 pb-1.5 pt-3.5 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
            />
            <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <DeepThinkToggle value={deepThink} onChange={setDeepThink} enabled={thinkingAllowed} />
                <ModelSelector models={models} value={selectedModelId} onChange={setSelectedModelId} />
                {selectedModelId === AUTO_MODEL_ID && routedLabel && (
                  <span className="hidden truncate text-[11px] text-muted-foreground/70 sm:inline">
                    → {routedLabel}
                  </span>
                )}
              </div>
              {isStreaming ? (
                <button
                  onClick={() => stop()}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-paper text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground"
                  title="Stop generating"
                  aria-label="Stop generating"
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink text-ivory transition-all hover:bg-moss-deep disabled:opacity-30"
                  title="Send"
                  aria-label="Send"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
            ALFRED can make mistakes — verify important figures.
          </p>
        </div>
      </div>
    </div>
  )
}

// Memoized: while a response streams, only the message being appended to
// changes identity — every completed row skips re-rendering (and skips
// re-running react-markdown, the expensive part) on each token.
const MessageRow = memo(function MessageRow({ message }: { message: UIMessage }) {
  const isUser = message.role === "user"

  const parts = message.parts.map((part, i) => {
    if (isTextUIPart(part)) {
      return <MarkdownMessage key={i} content={part.text} isUser={isUser} />
    }

    const partType: string = part.type
    if (isToolUIPart(part) || partType === "dynamic-tool") {
      const toolName =
        partType === "dynamic-tool"
          ? (part as unknown as { toolName: string }).toolName
          : partType.replace(/^tool-/, "")
      return (
        <span key={i} className="flex items-center gap-1.5 py-1 text-xs italic text-muted-foreground">
          <Database className="h-3 w-3 flex-shrink-0 text-sage" />
          Consulting {toolName}…
        </span>
      )
    }

    return null
  })

  if (isUser) {
    return (
      <div className="animate-msg-in flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-ivory">
          {parts}
        </div>
      </div>
    )
  }

  // Assistant replies sit flat on the paper — editorial, no bubble.
  return (
    <div className="animate-msg-in">
      <div className="mb-2 flex items-center gap-2.5">
        <Monogram />
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Alfred
        </span>
      </div>
      <div className="pl-[38px] text-[15px] leading-relaxed">{parts}</div>
    </div>
  )
})
