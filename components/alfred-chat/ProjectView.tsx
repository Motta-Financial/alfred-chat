"use client"

import { useCallback, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  BookOpen,
  Building2,
  FileText,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  addKnowledge,
  buildClientKnowledge,
  deleteKnowledge,
  deleteProject,
  listProjectKnowledge,
  searchHubClients,
  type ConversationRow,
  type HubClientHit,
  type KnowledgeRow,
  type ProjectRow,
} from "@/lib/supabase/queries"

interface ProjectViewProps {
  project: ProjectRow
  conversations: ConversationRow[]
  loadingConversationId: string | null
  onNewChat: () => void
  onOpenConversation: (id: string) => void
  onEdit: () => void
  onDeleted: () => void
}

export function ProjectView({
  project,
  conversations,
  loadingConversationId,
  onNewChat,
  onOpenConversation,
  onEdit,
  onDeleted,
}: ProjectViewProps) {
  const [knowledge, setKnowledge] = useState<KnowledgeRow[]>([])
  const [knowledgeLoading, setKnowledgeLoading] = useState(true)
  const [adding, setAdding] = useState<"none" | "text" | "client">("none")

  const refreshKnowledge = useCallback(async () => {
    setKnowledgeLoading(true)
    try {
      setKnowledge(await listProjectKnowledge(project.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load project knowledge.")
    } finally {
      setKnowledgeLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    void refreshKnowledge()
  }, [refreshKnowledge])

  const handleDeleteProject = async () => {
    if (
      !window.confirm(
        `Delete "${project.name}"? Chats keep their history but leave the project. Project knowledge is removed.`,
      )
    ) {
      return
    }
    try {
      await deleteProject(project.id)
      toast.success("Project deleted.")
      onDeleted()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the project.")
    }
  }

  const handleRemoveKnowledge = async (row: KnowledgeRow) => {
    try {
      await deleteKnowledge(row.id)
      setKnowledge((prev) => prev.filter((k) => k.id !== row.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove that item.")
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900">
                {project.name}
              </h1>
              {project.visibility === "team" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#8E9B79]/15 px-2 py-0.5 text-[11px] font-medium text-[#4a5240]">
                  <Users className="h-3 w-3" /> Team
                </span>
              )}
            </div>
            {project.description && (
              <p className="mt-1 text-sm text-gray-500">{project.description}</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-1.5 border-gray-200 text-gray-600"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteProject}
              className="gap-1.5 border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* New chat CTA */}
        <Button
          onClick={onNewChat}
          className="mt-6 w-full justify-center gap-2 rounded-xl bg-[#6B745D] py-5 text-white hover:bg-[#4a5240]"
        >
          <Plus className="h-4 w-4" /> New chat in this project
        </Button>

        {/* Instructions */}
        <section className="mt-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FileText className="h-4 w-4 text-[#6B745D]" /> Custom instructions
          </div>
          <div className="mt-2 rounded-xl border border-gray-100 bg-[#F4F1ED]/60 px-4 py-3">
            {project.instructions ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {project.instructions}
              </p>
            ) : (
              <button onClick={onEdit} className="text-sm text-gray-400 hover:text-[#6B745D]">
                No instructions yet — click to add how ALFRED should behave in this project.
              </button>
            )}
          </div>
        </section>

        {/* Knowledge */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <BookOpen className="h-4 w-4 text-[#6B745D]" /> Project knowledge
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdding(adding === "client" ? "none" : "client")}
                className="gap-1.5 border-gray-200 text-gray-600"
              >
                <Building2 className="h-3.5 w-3.5" /> Attach Hub client
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdding(adding === "text" ? "none" : "text")}
                className="gap-1.5 border-gray-200 text-gray-600"
              >
                <Plus className="h-3.5 w-3.5" /> Add text
              </Button>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            ALFRED uses everything here as context in every chat in this project.
          </p>

          {adding === "text" && (
            <AddTextKnowledge
              projectId={project.id}
              onAdded={(row) => {
                setKnowledge((prev) => [...prev, row])
                setAdding("none")
              }}
              onCancel={() => setAdding("none")}
            />
          )}
          {adding === "client" && (
            <AttachClientKnowledge
              projectId={project.id}
              onAdded={(row) => {
                setKnowledge((prev) => [...prev, row])
                setAdding("none")
              }}
              onCancel={() => setAdding("none")}
            />
          )}

          <div className="mt-3 space-y-2">
            {knowledgeLoading && (
              <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading knowledge…
              </div>
            )}
            {!knowledgeLoading && knowledge.length === 0 && adding === "none" && (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
                No knowledge yet. Paste reference text or attach a Hub client.
              </p>
            )}
            {knowledge.map((row) => (
              <div
                key={row.id}
                className="group flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    {row.source_type === "hub_client" ? (
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-[#6B745D]" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 flex-shrink-0 text-[#6B745D]" />
                    )}
                    <span className="truncate">{row.title}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">
                    {row.content}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveKnowledge(row)}
                  className="flex-shrink-0 rounded-md p-1 text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Chats in this project */}
        <section className="mt-8 pb-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <MessageSquare className="h-4 w-4 text-[#6B745D]" /> Chats
          </div>
          <div className="mt-3 space-y-1">
            {conversations.length === 0 && (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
                No chats in this project yet.
              </p>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onOpenConversation(conv.id)}
                disabled={loadingConversationId === conv.id}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#F4F1ED]"
              >
                <span className="truncate text-sm text-gray-700">
                  {conv.title || "Untitled conversation"}
                </span>
                <span className="flex-shrink-0 text-xs text-gray-400">
                  {loadingConversationId === conv.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function AddTextKnowledge({
  projectId,
  onAdded,
  onCancel,
}: {
  projectId: string
  onAdded: (row: KnowledgeRow) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Add a title and some content.")
      return
    }
    setSaving(true)
    try {
      onAdded(await addKnowledge({ projectId, title, content }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add knowledge.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-[#8E9B79]/40 bg-[#8E9B79]/5 p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Engagement letter summary)"
        autoFocus
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#8E9B79] focus:ring-2 focus:ring-[#8E9B79]/20"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="Paste reference text, notes, requirements…"
        className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#8E9B79] focus:ring-2 focus:ring-[#8E9B79]/20"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="border-gray-200">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={saving}
          className="bg-[#6B745D] text-white hover:bg-[#4a5240]"
        >
          {saving ? "Adding…" : "Add to knowledge"}
        </Button>
      </div>
    </div>
  )
}

function AttachClientKnowledge({
  projectId,
  onAdded,
  onCancel,
}: {
  projectId: string
  onAdded: (row: KnowledgeRow) => void
  onCancel: () => void
}) {
  const [term, setTerm] = useState("")
  const [hits, setHits] = useState<HubClientHit[]>([])
  const [searching, setSearching] = useState(false)
  const [attachingId, setAttachingId] = useState<string | null>(null)

  // Debounced search against Hub organizations/contacts
  useEffect(() => {
    if (term.trim().length < 2) {
      setHits([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        setHits(await searchHubClients(term))
      } catch {
        setHits([])
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [term])

  const handleAttach = async (hit: HubClientHit) => {
    setAttachingId(hit.id)
    try {
      const snapshot = await buildClientKnowledge(hit)
      const row = await addKnowledge({
        projectId,
        title: snapshot.title,
        content: snapshot.content,
        sourceType: "hub_client",
        sourceRef: snapshot.sourceRef,
      })
      toast.success(`Attached ${hit.name}.`)
      onAdded(row)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not attach that client.")
    } finally {
      setAttachingId(null)
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-[#8E9B79]/40 bg-[#8E9B79]/5 p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search Hub clients & contacts…"
          autoFocus
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-[#8E9B79] focus:ring-2 focus:ring-[#8E9B79]/20"
        />
        <button
          onClick={onCancel}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-300 hover:text-gray-500"
          aria-label="Close client search"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {searching && (
        <div className="flex items-center gap-2 px-1 py-1 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" /> Searching…
        </div>
      )}
      {!searching && term.trim().length >= 2 && hits.length === 0 && (
        <p className="px-1 py-1 text-xs text-gray-400">No matching clients found.</p>
      )}
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {hits.map((hit) => (
          <button
            key={`${hit.kind}:${hit.id}`}
            onClick={() => handleAttach(hit)}
            disabled={attachingId !== null}
            className="flex w-full items-center gap-2.5 rounded-lg bg-white px-3 py-2 text-left shadow-sm transition-colors hover:bg-[#F4F1ED] disabled:opacity-50"
          >
            {hit.kind === "organization" ? (
              <Building2 className="h-4 w-4 flex-shrink-0 text-[#6B745D]" />
            ) : (
              <Users className="h-4 w-4 flex-shrink-0 text-[#6B745D]" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-800">{hit.name}</span>
              {hit.detail && (
                <span className="block truncate text-xs text-gray-400">{hit.detail}</span>
              )}
            </span>
            {attachingId === hit.id && (
              <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-gray-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
