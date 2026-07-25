"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { UIMessage } from "ai"

import { AlfredChat } from "@/components/alfred-chat/AlfredChat"
import { ConversationSidebar } from "@/components/alfred-chat/ConversationSidebar"
import { ProjectDialog } from "@/components/alfred-chat/ProjectDialog"
import { ProjectView } from "@/components/alfred-chat/ProjectView"
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

  // Project dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null)

  // The project a brand-new conversation should be filed under, readable
  // from the data-conversation callback without stale-closure issues.
  const activeProjectIdRef = useRef<string | null>(null)
  useEffect(() => {
    activeProjectIdRef.current = activeProject?.id ?? null
  }, [activeProject])

  const refreshData = useCallback(async () => {
    try {
      const [projectRows, conversationRows] = await Promise.all([
        listMyProjects(),
        listMyConversations(),
      ])
      setProjects(projectRows)
      setConversations(conversationRows)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + live updates on conversation changes.
  useEffect(() => {
    void refreshData()
    const unsubscribe = subscribeToConversations(() => void refreshData())
    return unsubscribe
  }, [refreshData])

  /** The Hub created a conversation for the current chat. File it under
   *  the active project (the Hub doesn't know about projects; this write
   *  is owner-scoped by RLS) and refresh the sidebar. */
  const handleConversationId = useCallback(
    (id: string) => {
      setConversationId(id)
      const projectId = activeProjectIdRef.current
      const link = projectId
        ? assignConversationToProject(id, projectId).catch(() => {
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
      setLoadingConversationId(id)
      try {
        const messages = await listMessages(id)
        const conv = conversations.find((c) => c.id === id)
        const project = conv?.project_id
          ? (projects.find((p) => p.id === conv.project_id) ?? null)
          : null
        setActiveProject(project)
        setConversationId(id)
        setInitialMessages(messages)
        setView({ kind: "chat" })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load conversation")
      } finally {
        setLoadingConversationId(null)
      }
    },
    [conversationId, view.kind, conversations, projects],
  )

  const startNewChat = useCallback((project: ProjectRow | null) => {
    setActiveProject(project)
    setConversationId(null)
    setInitialMessages(undefined)
    setView({ kind: "chat" })
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
        />
      </div>

      {/* Main area */}
      <div className="min-w-0 flex-1">
        {view.kind === "project" && activeProject ? (
          <ProjectView
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
            conversationId={conversationId}
            projectId={activeProject?.id ?? null}
            projectName={activeProject?.name ?? null}
            onConversationId={handleConversationId}
            onOpenProject={() => activeProject && openProject(activeProject)}
            initialMessages={initialMessages}
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
