"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isTextUIPart, isToolUIPart, type UIMessage } from "ai"
import { Database, Send, Square } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { Button } from "@/components/ui/button"
import { MarkdownMessage } from "@/components/markdown-message"
import { createClient } from "@/lib/supabase/client"
import { getBearerToken, HUB_CHAT_URL } from "@/lib/hub"
import type { SupabaseClient } from "@supabase/supabase-js"

type ConversationId = string | null

interface AlfredChatProps {
  conversationId: ConversationId
  onConversationId: (id: string) => void
  initialMessages?: UIMessage[]
}

function makeTransport(supabase: SupabaseClient, getConversationId: () => ConversationId) {
  return new DefaultChatTransport({
    api: HUB_CHAT_URL,
    credentials: "omit",
    headers: async () => {
      const token = await getBearerToken(supabase)
      return { Authorization: `Bearer ${token}` }
    },
    body: () => {
      const id = getConversationId()
      return {
        audience: "staff",
        ...(id ? { conversationId: id } : {}),
      }
    },
  })
}

export function AlfredChat({ conversationId, onConversationId, initialMessages }: AlfredChatProps) {
  const supabase = createClient()

  // Keep conversationId in a ref so the transport closure always reads the latest value
  // without needing to recreate the transport on every render.
  const conversationIdRef = useRef<ConversationId>(conversationId)
  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  const transportRef = useRef<DefaultChatTransport | null>(null)
  if (!transportRef.current) {
    transportRef.current = makeTransport(supabase, () => conversationIdRef.current)
  }

  const { messages, setMessages, sendMessage, stop, status } = useChat({
    transport: transportRef.current,
    messages: initialMessages,
    onData(dataParts) {
      for (const part of dataParts) {
        // Hub emits { type: 'data-conversation', id: <uuid> }
        if ((part as { type?: string; id?: string }).type === "data-conversation") {
          const id = (part as { type: string; id: string }).id
          if (id) onConversationId(id)
        }
      }
    },
  })

  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isStreaming = status === "streaming" || status === "submitted"

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Reset messages when initialMessages prop changes (conversation switch)
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }
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
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <p className="text-lg font-medium">How can I help you today?</p>
            <p className="text-sm">Start a conversation with ALFRED.</p>
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
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <TextareaAutosize
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ALFRED…"
            minRows={1}
            maxRows={8}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-50"
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
              className="flex-shrink-0 rounded-xl h-11 w-11 bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageRow({ message }: { message: UIMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-amber-500 text-white rounded-tr-sm"
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

          if (isToolUIPart(part) || part.type === "dynamic-tool") {
            const toolName =
              part.type === "dynamic-tool"
                ? (part as { toolName: string }).toolName
                : part.type.replace(/^tool-/, "")
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
}
