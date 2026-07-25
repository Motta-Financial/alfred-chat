"use client"

import { formatDistanceToNow } from "date-fns"
import { Folder, FolderOpen, Loader2, MessageSquare, Plus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
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
}: ConversationSidebarProps) {
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]))

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-[#F4F1ED]">
      {/* New chat */}
      <div className="border-b border-gray-200 px-4 py-4">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2 border-gray-200 bg-white text-gray-700 hover:bg-[#8E9B79]/10"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Projects */}
        <div className="mb-1 flex items-center justify-between px-4 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Projects
          </span>
          <button
            onClick={onNewProject}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white hover:text-[#6B745D]"
            title="New project"
            aria-label="New project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {projects.length === 0 && !loading && (
          <button
            onClick={onNewProject}
            className="mx-4 mb-2 w-[calc(100%-2rem)] rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-left text-xs text-gray-400 transition-colors hover:border-[#8E9B79] hover:text-[#6B745D]"
          >
            Create a project to give ALFRED standing instructions & client context.
          </button>
        )}

        {projects.map((project) => {
          const isActive = activeProjectId === project.id
          return (
            <button
              key={project.id}
              onClick={() => onOpenProject(project)}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/70",
                isActive && "border-r-2 border-[#6B745D] bg-white",
              )}
            >
              {isActive ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0 text-[#6B745D]" />
              ) : (
                <Folder className="h-4 w-4 flex-shrink-0 text-gray-400" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                {project.name}
              </span>
              {project.visibility === "team" && (
                <Users className="h-3 w-3 flex-shrink-0 text-gray-300" aria-label="Shared with team" />
              )}
            </button>
          )
        })}

        {/* Recent chats */}
        <div className="mb-1 mt-4 px-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Chats
          </span>
        </div>

        {loading && conversations.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}

        {error && <p className="px-4 py-3 text-xs text-red-500">{error}</p>}

        {!loading && !error && conversations.length === 0 && (
          <p className="px-4 py-3 text-xs text-gray-400">No conversations yet.</p>
        )}

        {conversations.map((conv) => {
          const projectName = conv.project_id ? projectNameById.get(conv.project_id) : null
          return (
            <button
              key={conv.id}
              onClick={() => onOpenConversation(conv.id)}
              disabled={loadingConversationId === conv.id}
              className={cn(
                "flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-white/70",
                activeConversationId === conv.id && "border-r-2 border-[#6B745D] bg-white",
              )}
            >
              <span className="truncate text-sm font-medium leading-tight text-gray-800">
                {conv.title || "Untitled conversation"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                {loadingConversationId === conv.id ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </>
                ) : (
                  <>
                    {projectName && (
                      <span className="inline-flex min-w-0 items-center gap-1 text-[#6B745D]/80">
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
      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Conversation history</span>
        </div>
      </div>
    </div>
  )
}
