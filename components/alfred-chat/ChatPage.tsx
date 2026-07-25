"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { UIMessage } from "ai"

import { AlfredChat } from "@/components/alfred-chat/AlfredChat"
import { ConversationSidebar } from "@/components/alfred-chat/ConversationSidebar"
import { ProjectDialog } from "@/components/alfred-chat/ProjectDialog"
import { ProjectView } from "@/components/alfred-chat/ProjectView"
import { useModelCatalog } from "@/components/alfred-chat/ModelSelector"
import {
  assignConversationToProject,
  listMessages,
  listMyConversations,
  listMyProjects,
  subscribeToConversations,
  type ConversationRow,
  type ProjectRow,
} from "@/lib/supabase/queries"

type View = { kind: "chat" } | { kind: "project" }

export function ChatPage() {
  // Data
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Navigation / chat state
  const [view, setView] = useState<View>({ kind: "chat" })
  const [activeProject, setActiveProject] = useState<ProjectRow | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | undefined>(undefined)
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)

  // Chat session token. Bumped on every user-initiated navigation so
  // AlfredChat remounts with a fresh useChat instance — an in-flight
  // stream from the previous thread can never bleed into the new one.
  // (It does NOT change when the Hub's data-conversation event promotes a
  // new chat to a persisted conversation — that must not interrupt the
  // live stream.)
  const [chatKey, setChatKey] = useState(0)
  const chatKeyRef = useRef(0)
  useEffect(() => {
    chatKeyRef.current = chatKey
  }, [chatKey])

  // Monotonic tokens so stale async resolutions are dropped.
  const openSeqRef = useRef(0)
  const refreshSeqRef = useRef(0)

  // Project dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null)

  const refreshData = useCallback(async () => {
    const seq = ++refreshSeqRef.current
    try {
      const [projectRows, conversationRows] = await Promise.all([
        listMyProjects(),
        listMyConversations(),
      ])
      if (seq !== refreshSeqRef.current) return // a newer refresh already landed
      setProjects(projectRows)
      setConversations(conversationRows)
      setError(null)
    } catch (err) {
      if (seq !== refreshSeqRef.current) return
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      if (seq === refreshSeqRef.current) setLoading(false)
    }
  }, [])

  // Initial load + live updates on conversation changes.
  useEffect(() => {
    void refreshData()
    const unsubscribe = subscribeToConversations(() => void refreshData())
    return unsubscribe
  }, [refreshData])

  // Model catalog lives here (not in AlfredChat) so remounting the chat
  // surface on navigation doesn't refetch the Hub catalog each time.
  const modelCatalog = useModelCatalog()

  /**
   * The Hub created a conversation for a chat session. `originKey` and
   * `originProjectId` were captured when that session's AlfredChat was
   * mounted, so a late event cannot clobber a conversation the user has
   * since navigated to, and the chat is always filed under the project it
   * was actually started in — not whatever is active when the event lands.
   */
  const handleConversationId = useCallback(
    (id: string, originKey: number, originProjectId: string | null) => {
      if (originKey === chatKeyRef.current) {
        setConversationId(id)
      }
      const link = originProjectId
        ? assignConversationToProject(id, originProjectId).catch(() => {
            toast.error("Chat saved, but it could not be filed under the project.")
          })
        : Promise.resolve()
      void link.then(() => refreshData())
    },
    [refreshData],
  )

  const openConversation = useCallback(
    async (id: string) => {
      if (id === conversationId && view.kind === "chat") return
      const seq = ++openSeqRef.current
      setLoadingConversationId(id)
      try {
        const messages = await listMessages(id)
        if (seq !== openSeqRef.current) return // user clicked something newer
        const conv = conversations.find((c) => c.id === id)
        const project = conv?.project_id
          ? (projects.find((p) => p.id === conv.project_id) ?? null)
          : null
        setActiveProject(project)
        setConversationId(id)
        setInitialMessages(messages)
        setView({ kind: "chat" })
        setChatKey((k) => k + 1)
      } catch (err) {
        if (seq === openSeqRef.current) {
          toast.error(err instanceof Error ? err.message : "Failed to load conversation")
        }
      } finally {
        if (seq === openSeqRef.current) setLoadingConversationId(null)
      }
    },
    [conversationId, view.kind, conversations, projects],
  )

  const startNewChat = useCallback((project: ProjectRow | null) => {
    openSeqRef.current++ // invalidate any in-flight conversation open
    setActiveProject(project)
    setConversationId(null)
    setInitialMessages(undefined)
    setView({ kind: "chat" })
    setChatKey((k) => k + 1)
  }, [])

  const openProject = useCallback((project: ProjectRow) => {
    setActiveProject(project)
    setView({ kind: "project" })
  }, [])

  const handleProjectSaved = useCallback(
    (saved: ProjectRow) => {
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === saved.id)
        return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]
      })
      setActiveProject((prev) => (prev && prev.id === saved.id ? saved : prev))
      // A newly created project becomes the active view.
      if (!editingProject) {
        setActiveProject(saved)
        setView({ kind: "project" })
      }
      void refreshData()
    },
    [editingProject, refreshData],
  )

  const handleProjectDeleted = useCallback(() => {
    setActiveProject(null)
    setView({ kind: "chat" })
    setConversationId(null)
    setInitialMessages(undefined)
    setChatKey((k) => k + 1)
    void refreshData()
  }, [refreshData])

  const projectConversations = activeProject
    ? conversations.filter((c) => c.project_id === activeProject.id)
    : []

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="hidden w-72 flex-shrink-0 md:block">
        <ConversationSidebar
          projects={projects}
          conversations={conversations}
          loading={loading}
          error={error}
          activeConversationId={view.kind === "chat" ? conversationId : null}
          activeProjectId={activeProject?.id ?? null}
          loadingConversationId={loadingConversationId}
          onNewChat={() => startNewChat(null)}
          onNewProject={() => {
            setEditingProject(null)
            setDialogOpen(true)
          }}
          onOpenProject={openProject}
          onOpenConversation={(id) => void openConversation(id)}
          onRetry={() => void refreshData()}
        />
      </div>

      {/* Main area */}
      <div className="min-w-0 flex-1">
        {view.kind === "project" && activeProject ? (
          <ProjectView
            key={activeProject.id}
            project={activeProject}
            conversations={projectConversations}
            loadingConversationId={loadingConversationId}
            onNewChat={() => startNewChat(activeProject)}
            onOpenConversation={(id) => void openConversation(id)}
            onEdit={() => {
              setEditingProject(activeProject)
              setDialogOpen(true)
            }}
            onDeleted={handleProjectDeleted}
          />
        ) : (
          <AlfredChat
            key={chatKey}
            conversationId={conversationId}
            projectId={activeProject?.id ?? null}
            projectName={activeProject?.name ?? null}
            onConversationId={(id) =>
              handleConversationId(id, chatKey, activeProject?.id ?? null)
            }
            onOpenProject={() => activeProject && openProject(activeProject)}
            initialMessages={initialMessages}
            modelCatalog={modelCatalog}
          />
        )}
      </div>

      <ProjectDialog
        open={dialogOpen}
        project={editingProject}
        onClose={() => setDialogOpen(false)}
        onSaved={handleProjectSaved}
      />
    </div>
  )
}
