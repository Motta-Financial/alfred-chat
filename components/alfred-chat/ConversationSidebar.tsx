"use client"

import { formatDistanceToNow } from "date-fns"
import { Folder, FolderOpen, Loader2, Plus, Users } from "lucide-react"

import type { ConversationRow, ProjectRow } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"

interface ConversationSidebarProps {
  projects: ProjectRow[]
  conversations: ConversationRow[]
  loading: boolean
  error: string | null
  activeConversationId: string | null
  activeProjectId: string | null
  loadingConversationId: string | null
  onNewChat: () => void
  onNewProject: () => void
  onOpenProject: (project: ProjectRow) => void
  onOpenConversation: (id: string) => void
  onRetry: () => void
}

export function ConversationSidebar({
  projects,
  conversations,
  loading,
  error,
  activeConversationId,
  activeProjectId,
  loadingConversationId,
  onNewChat,
  onNewProject,
  onOpenProject,
  onOpenConversation,
  onRetry,
}: ConversationSidebarProps) {
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]))

  return (
    <div className="dark-rail flex h-full flex-col border-r border-ivory/[0.07] bg-ink text-ivory">
      {/* New chat */}
      <div className="px-3 pb-2 pt-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2.5 rounded-xl border border-ivory/10 bg-ivory/[0.04] px-3.5 py-2.5 text-sm font-medium text-ivory/90 transition-all hover:border-sage/40 hover:bg-ivory/[0.08]"
        >
          <Plus className="h-4 w-4 text-sage" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {/* Projects */}
        <div className="mb-1 flex items-center justify-between px-3 pt-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ivory/35">
            Projects
          </span>
          <button
            onClick={onNewProject}
            className="rounded-md p-1 text-ivory/35 transition-colors hover:bg-ivory/10 hover:text-sage"
            title="New project"
            aria-label="New project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {projects.length === 0 && !loading && (
          <button
            onClick={onNewProject}
            className="mx-1 mb-2 w-[calc(100%-0.5rem)] rounded-xl border border-dashed border-ivory/15 px-3 py-2.5 text-left text-xs leading-relaxed text-ivory/40 transition-colors hover:border-sage/40 hover:text-ivory/60"
          >
            Create a project to give ALFRED standing instructions &amp; client context.
          </button>
        )}

        {projects.map((project) => {
          const isActive = activeProjectId === project.id
          return (
            <button
              key={project.id}
              onClick={() => onOpenProject(project)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                isActive
                  ? "bg-ivory/[0.09] text-ivory"
                  : "text-ivory/70 hover:bg-ivory/[0.05] hover:text-ivory/90",
              )}
            >
              {isActive ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0 text-sage" />
              ) : (
                <Folder className="h-4 w-4 flex-shrink-0 text-ivory/35" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{project.name}</span>
              {project.visibility === "team" && (
                <Users
                  className="h-3 w-3 flex-shrink-0 text-ivory/30"
                  aria-label="Shared with team"
                />
              )}
            </button>
          )
        })}

        {/* Recent chats */}
        <div className="mb-1 mt-4 px-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ivory/35">
            Chats
          </span>
        </div>

        {loading && conversations.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-ivory/40" />
          </div>
        )}

        {error && (
          <div className="mx-1 rounded-xl bg-red-950/40 px-3 py-3 ring-1 ring-red-400/20">
            <p className="text-xs leading-relaxed text-red-300/90">{error}</p>
            <button
              onClick={onRetry}
              className="mt-1.5 text-xs font-medium text-sage underline underline-offset-2 hover:text-ivory"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <p className="px-3 py-3 text-xs text-ivory/35">No conversations yet.</p>
        )}

        {conversations.map((conv) => {
          const projectName = conv.project_id ? projectNameById.get(conv.project_id) : null
          const isActive = activeConversationId === conv.id
          return (
            <button
              key={conv.id}
              onClick={() => onOpenConversation(conv.id)}
              disabled={loadingConversationId === conv.id}
              className={cn(
                "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
                isActive
                  ? "bg-ivory/[0.09] text-ivory"
                  : "text-ivory/70 hover:bg-ivory/[0.05] hover:text-ivory/90",
              )}
            >
              <span className="truncate text-sm font-medium leading-tight">
                {conv.title || "Untitled conversation"}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-ivory/35">
                {loadingConversationId === conv.id ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </>
                ) : (
                  <>
                    {projectName && (
                      <span className="inline-flex min-w-0 items-center gap-1 text-sage/70">
                        <Folder className="h-3 w-3 flex-shrink-0" />
                        <span className="max-w-[7rem] truncate">{projectName}</span>
                        <span aria-hidden>·</span>
                      </span>
                    )}
                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                  </>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-ivory/[0.07] px-5 py-3">
        <p className="text-[10px] tracking-wide text-ivory/30">
          © {new Date().getFullYear()} Motta Financial · Internal use only
        </p>
      </div>
    </div>
  )
}
