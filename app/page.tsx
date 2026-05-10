"use client"

import { useCallback, useState } from "react"
import { AlfredChat } from "@/components/alfred-chat/AlfredChat"
import { ConversationSidebar } from "@/components/alfred-chat/ConversationSidebar"
import type { UIMessage } from "ai"

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | undefined>(undefined)
  const [sidebarRefresh, setSidebarRefresh] = useState(0)

  const handleConversationId = useCallback((id: string) => {
    setConversationId(id)
    // Trigger sidebar refresh to show the new conversation
    setSidebarRefresh((n) => n + 1)
  }, [])

  const handleSelectConversation = useCallback((id: string, messages: UIMessage[]) => {
    setConversationId(id)
    setInitialMessages(messages)
  }, [])

  const handleNewChat = useCallback(() => {
    setConversationId(null)
    setInitialMessages(undefined)
  }, [])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 hidden md:block">
        <ConversationSidebar
          activeConversationId={conversationId}
          refreshTrigger={sidebarRefresh}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 min-w-0">
        <AlfredChat
          conversationId={conversationId}
          onConversationId={handleConversationId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  )
}
