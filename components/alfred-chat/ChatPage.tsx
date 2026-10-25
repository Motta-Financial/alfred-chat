"use client"

import { useCallback, useRef, useState } from "react"

import { AlfredChat } from "@/components/alfred-chat/AlfredChat"
import { ConversationSidebar } from "@/components/alfred-chat/ConversationSidebar"
import { ProjectDialog } from "@/components/alfred-chat/ProjectDialog"
import { ProjectView } from "@/components/alfred-chat/ProjectView"
import {
  MOCK_CONVERSATIONS,
  MOCK_KNOWLEDGE,
  MOCK_MESSAGES,
  MOCK_PROJECTS,
  type ConversationRow,
  type DemoMessage,
  type KnowledgeRow,
  type ProjectRow,
} from "@/lib/demo/mock-data"

type View = { kind: "chat" } | { kind: "project" }

const TITLE_MAX = 48

function titleFrom(text: string) {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > TITLE_MAX ? `${clean.slice(0, TITLE_MAX - 1)}…` : clean
}

export function ChatPage() {
  // All data lives in React state, seeded from the fictional mock data.
  const [projects, setProjects] = useState<ProjectRow[]>(MOCK_PROJECTS)
  const [conversations, setConversations] = useState<ConversationRow[]>(MOCK_CONVERSATIONS)
  const [threads, setThreads] = useState<Record<string, DemoMessage[]>>(MOCK_MESSAGES)
  const [knowledge, setKnowledge] = useState<Record<string, KnowledgeRow[]>>(MOCK_KNOWLEDGE)

  // Navigation. A brand-new chat gets a draft id up front; it is added to
  // the sidebar list once the first message is sent.
  const draftCounter = useRef(0)
  const nextDraftId = () => `new-${++draftCounter.current}`
  const [view, setView] = useState<View>({ kind: "chat" })
  const [activeProject, setActiveProject] = useState<ProjectRow | null>(null)
  const [activeId, setActiveId] = useState<string>(() => nextDraftId())
  const activeProjectIdRef = useRef<string | null>(null)
  activeProjectIdRef.current = activeProject?.id ?? null

  // Project dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null)

  const appendMessage = useCallback((id: string, message: DemoMessage) => {
    const now = new Date().toISOString()
    setThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), message] }))
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === id)
      if (existing) {
        return [{ ...existing, updated_at: now }, ...prev.filter((c) => c.id !== id)]
      }
      if (message.role !== "user") return prev
      return [
        {
          id,
          title: titleFrom(message.text),
          project_id: activeProjectIdRef.current,
          created_at: now,
          updated_at: now,
        },
        ...prev,
      ]
    })
  }, [])

  const openConversation = useCallback(
    (id: string) => {
      const conv = conversations.find((c) => c.id === id)
      const project = conv?.project_id
        ? (projects.find((p) => p.id === conv.project_id) ?? null)
        : null
      setActiveProject(project)
      setActiveId(id)
      setView({ kind: "chat" })
    },
    [conversations, projects],
  )

  const startNewChat = useCallback((project: ProjectRow | null) => {
    setActiveProject(project)
    setActiveId(nextDraftId())
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
      if (editingProject) {
        setActiveProject((prev) => (prev && prev.id === saved.id ? saved : prev))
      } else {
        setKnowledge((prev) => ({ ...prev, [saved.id]: [] }))
        setActiveProject(saved)
        setView({ kind: "project" })
      }
    },
    [editingProject],
  )

  const handleProjectDeleted = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    setConversations((prev) =>
      prev.map((c) => (c.project_id === projectId ? { ...c, project_id: null } : c)),
    )
    setKnowledge((prev) => {
      const { [projectId]: _removed, ...rest } = prev
      return rest
    })
    setActiveProject(null)
    setActiveId(nextDraftId())
    setView({ kind: "chat" })
  }, [])

  const projectConversations = activeProject
    ? conversations.filter((c) => c.project_id === activeProject.id)
    : []

  const activeConversationExists = conversations.some((c) => c.id === activeId)

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="hidden w-72 flex-shrink-0 md:block">
        <ConversationSidebar
          projects={projects}
          conversations={conversations}
          activeConversationId={
            view.kind === "chat" && activeConversationExists ? activeId : null
          }
          activeProjectId={activeProject?.id ?? null}
          onNewChat={() => startNewChat(null)}
          onNewProject={() => {
            setEditingProject(null)
            setDialogOpen(true)
          }}
          onOpenProject={openProject}
          onOpenConversation={openConversation}
        />
      </div>

      {/* Main area */}
      <div className="min-w-0 flex-1">
        {view.kind === "project" && activeProject ? (
          <ProjectView
            key={activeProject.id}
            project={activeProject}
            conversations={projectConversations}
            knowledge={knowledge[activeProject.id] ?? []}
            onKnowledgeChange={(rows) =>
              setKnowledge((prev) => ({ ...prev, [activeProject.id]: rows }))
            }
            onNewChat={() => startNewChat(activeProject)}
            onOpenConversation={openConversation}
            onEdit={() => {
              setEditingProject(activeProject)
              setDialogOpen(true)
            }}
            onDeleted={() => handleProjectDeleted(activeProject.id)}
          />
        ) : (
          <AlfredChat
            key={activeId}
            conversationId={activeId}
            projectName={activeProject?.name ?? null}
            messages={threads[activeId] ?? []}
            onAppend={appendMessage}
            onOpenProject={() => activeProject && openProject(activeProject)}
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
