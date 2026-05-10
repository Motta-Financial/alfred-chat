"use client"

import { useCallback, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { getBearerToken, HUB_CONVERSATIONS_URL } from "@/lib/hub"
import type { UIMessage } from "ai"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  updated_at: string
}

interface ConversationSidebarProps {
  activeConversationId: string | null
  refreshTrigger: number
  onSelect: (id: string, messages: UIMessage[]) => void
  onNew: () => void
}

export function ConversationSidebar({
  activeConversationId,
  refreshTrigger,
  onSelect,
  onNew,
}: ConversationSidebarProps) {
  const supabase = createClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getBearerToken(supabase)
      const res = await fetch(HUB_CONVERSATIONS_URL, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
      const sorted = (data.conversations as Conversation[]).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      setConversations(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch on mount and whenever the trigger increments (after a message is sent)
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations, refreshTrigger])

  const handleSelect = async (id: string) => {
    if (id === activeConversationId) return
    setLoadingId(id)
    try {
      const token = await getBearerToken(supabase)
      const res = await fetch(`${HUB_CONVERSATIONS_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()

      // Map Hub message format to AI SDK UIMessage format
      const uiMessages: UIMessage[] = (data.messages as Array<{
        role: "user" | "assistant"
        content: string
        created_at: string
      }>).map((m, i) => ({
        id: `${id}-${i}`,
        role: m.role,
        parts: [{ type: "text" as const, text: m.content }],
        content: m.content,
        createdAt: new Date(m.created_at),
      }))

      onSelect(id, uiMessages)
    } catch (err) {
      console.error("Failed to load conversation:", err)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F4F1ED] border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <Button
          onClick={onNew}
          variant="outline"
          className="w-full justify-start gap-2 bg-white hover:bg-amber-50 border-gray-200 text-gray-700"
        >
          <Plus className="w-4 h-4" />
          New chat
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && conversations.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 px-4 py-3">{error}</p>
        )}

        {!loading && !error && conversations.length === 0 && (
          <p className="text-xs text-gray-400 px-4 py-3">No conversations yet.</p>
        )}

        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => handleSelect(conv.id)}
            disabled={loadingId === conv.id}
            className={cn(
              "w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-white/70 transition-colors",
              activeConversationId === conv.id && "bg-white border-r-2 border-amber-500",
            )}
          >
            <span className="text-sm font-medium text-gray-800 truncate leading-tight">
              {conv.title || "Untitled conversation"}
            </span>
            <span className="text-xs text-gray-400">
              {loadingId === conv.id ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                </span>
              ) : (
                formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Footer icon */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Conversation history</span>
        </div>
      </div>
    </div>
  )
}
