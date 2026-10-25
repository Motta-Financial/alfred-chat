"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { ArrowUp, Folder, Square } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { MarkdownMessage } from "@/components/markdown-message"
import { ModelSelector } from "@/components/alfred-chat/ModelSelector"
import { DeepThinkToggle, useDeepThink } from "@/components/alfred-chat/DeepThinkToggle"
import { DEMO_QUESTIONS, FIRM_NAME, getScriptedReply, type DemoMessage } from "@/lib/demo/mock-data"
import { cn } from "@/lib/utils"

const REPLY_DELAY_MS = 1200

interface AlfredChatProps {
  conversationId: string
  projectName?: string | null
  messages: DemoMessage[]
  /** Adds a message to the conversation's thread (owned by ChatPage). */
  onAppend: (conversationId: string, message: DemoMessage) => void
  onOpenProject?: () => void
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

const EXAMPLE_PROMPTS = DEMO_QUESTIONS

export function AlfredChat({
  conversationId,
  projectName = null,
  messages,
  onAppend,
  onOpenProject,
}: AlfredChatProps) {
  const [deepThink, setDeepThink] = useDeepThink()

  const [input, setInput] = useState("")
  const [pending, setPending] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  // The scripted reply lands after this chat may have unmounted (the user
  // navigated away), so it always goes through the latest callback.
  const onAppendRef = useRef(onAppend)
  useEffect(() => {
    onAppendRef.current = onAppend
  }, [onAppend])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, pending])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendText = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text || pending) return

      setInput("")
      onAppend(conversationId, { id: crypto.randomUUID(), role: "user", text })
      setPending(true)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        onAppendRef.current(conversationId, {
          id: crypto.randomUUID(),
          role: "assistant",
          text: getScriptedReply(text),
        })
        if (mountedRef.current) setPending(false)
      }, REPLY_DELAY_MS)
    },
    [pending, conversationId, onAppend],
  )

  const handleSend = useCallback(() => sendText(input), [sendText, input])

  const handleStop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setPending(false)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
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
                Your firm&apos;s right hand.
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {projectName
                  ? `Start a conversation in ${projectName} — its instructions and knowledge apply.`
                  : `Ask me about any client, tax return, or open work. I'm connected to all of ${FIRM_NAME}'s systems.`}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendText(prompt)}
                    className="rounded-full border border-line bg-paper-2 px-3.5 py-2 text-xs font-medium text-foreground/70 transition-all hover:border-sage/60 hover:text-foreground hover:shadow-console"
                  >
                    {prompt}
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

              {pending && (
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
              disabled={pending}
              className="w-full resize-none bg-transparent px-4 pb-1.5 pt-3.5 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
            />
            <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <DeepThinkToggle value={deepThink} onChange={setDeepThink} enabled />
                <ModelSelector />
              </div>
              {pending ? (
                <button
                  onClick={handleStop}
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

const MessageRow = memo(function MessageRow({ message }: { message: DemoMessage }) {
  if (message.role === "user") {
    return (
      <div className="animate-msg-in flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-ivory">
          <MarkdownMessage content={message.text} isUser />
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
      <div className="pl-[38px] text-[15px] leading-relaxed">
        <MarkdownMessage content={message.text} />
      </div>
    </div>
  )
})
