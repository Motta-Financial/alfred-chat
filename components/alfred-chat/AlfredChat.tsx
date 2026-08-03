"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isTextUIPart, isToolUIPart, type UIMessage } from "ai"
import { Database, Folder, Send, Square } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { Button } from "@/components/ui/button"
import { MarkdownMessage } from "@/components/markdown-message"
import { createClient } from "@/lib/supabase/client"
import { getBearerToken, HUB_CHAT_URL, assertHubConfigured } from "@/lib/hub"
import { ModelSelector, type ModelCatalog } from "@/components/alfred-chat/ModelSelector"
import { DeepThinkToggle, useDeepThink } from "@/components/alfred-chat/DeepThinkToggle"
import { getModelById } from "@/lib/models"
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
      () => modelIdRef.current,
      // Gate `think` on the capability of whichever model the user has
      // selected at send time. Belt and suspenders -- the Hub does the
      // same check and ignores the field on unsupported models.
      () =>
        deepThinkRef.current &&
        getModelById(modelsRef.current, modelIdRef.current).capabilities.supportsThinking,
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
    setInput("")
    await sendMessage({ text })
  }, [input, isStreaming, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project context banner */}
      {projectName && (
        <button
          onClick={onOpenProject}
          className="flex items-center gap-2 border-b border-[#8E9B79]/30 bg-[#8E9B79]/10 px-4 py-2 text-left transition-colors hover:bg-[#8E9B79]/20"
          title="Open project"
        >
          <Folder className="h-3.5 w-3.5 flex-shrink-0 text-[#6B745D]" />
          <span className="truncate text-xs font-medium text-[#4a5240]">{projectName}</span>
          <span className="text-xs text-[#4a5240]/60">
            — project instructions &amp; knowledge apply
          </span>
        </button>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <p className="text-lg font-medium">How can I help you today?</p>
            <p className="text-sm">
              {projectName
                ? `Start a conversation in ${projectName}.`
                : "Start a conversation with ALFRED."}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageRow key={message.id} message={message} />
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <span className="animate-pulse text-gray-400">ALFRED is thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
              Model
            </span>
            <div className="flex items-center gap-2">
              <DeepThinkToggle
                value={deepThink}
                onChange={setDeepThink}
                enabled={thinkingAllowed}
              />
              <ModelSelector models={models} value={selectedModelId} onChange={setSelectedModelId} />
            </div>
          </div>
          <div className="flex items-end gap-3">
          <TextareaAutosize
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ALFRED…"
            minRows={1}
            maxRows={8}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8E9B79] focus:ring-2 focus:ring-[#8E9B79]/20 disabled:opacity-50"
          />
          {isStreaming ? (
            <Button
              onClick={() => stop()}
              size="icon"
              variant="outline"
              className="flex-shrink-0 rounded-xl h-11 w-11 border-gray-200"
              title="Stop generating"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="flex-shrink-0 rounded-xl h-11 w-11 bg-[#6B745D] hover:bg-[#4a5240] text-white disabled:opacity-40"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
          </div>
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

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#6B745D] text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-900 rounded-tl-sm"
        }`}
      >
        {message.parts.map((part, i) => {
          if (isTextUIPart(part)) {
            return (
              <MarkdownMessage
                key={i}
                content={part.text}
                isUser={isUser}
              />
            )
          }

          const partType: string = part.type
          if (isToolUIPart(part) || partType === "dynamic-tool") {
            const toolName =
              partType === "dynamic-tool"
                ? (part as unknown as { toolName: string }).toolName
                : partType.replace(/^tool-/, "")
            return (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs text-gray-500 italic py-1"
              >
                <Database className="w-3 h-3 flex-shrink-0" />
                Querying {toolName}…
              </span>
            )
          }

          return null
        })}
      </div>
    </div>
  )
})
