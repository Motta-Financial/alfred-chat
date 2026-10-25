"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  BookOpen,
  Building2,
  FileText,
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
  buildClientKnowledge,
  searchMockClients,
  type ConversationRow,
  type KnowledgeRow,
  type MockClient,
  type ProjectRow,
} from "@/lib/demo/mock-data"

interface ProjectViewProps {
  project: ProjectRow
  conversations: ConversationRow[]
  knowledge: KnowledgeRow[]
  onKnowledgeChange: (rows: KnowledgeRow[]) => void
  onNewChat: () => void
  onOpenConversation: (id: string) => void
  onEdit: () => void
  onDeleted: () => void
}

export function ProjectView({
  project,
  conversations,
  knowledge,
  onKnowledgeChange,
  onNewChat,
  onOpenConversation,
  onEdit,
  onDeleted,
}: ProjectViewProps) {
  const [adding, setAdding] = useState<"none" | "text" | "client">("none")

  // In the demo the signed-in user owns every project.
  const isOwner = true

  const handleDeleteProject = () => {
    if (
      !window.confirm(
        `Delete "${project.name}"? Chats keep their history but leave the project. Project knowledge is removed.`,
      )
    ) {
      return
    }
    toast.success("Project deleted.")
    onDeleted()
  }

  const handleRemoveKnowledge = (row: KnowledgeRow) => {
    onKnowledgeChange(knowledge.filter((k) => k.id !== row.id))
  }

  const handleAdded = (row: KnowledgeRow) => {
    onKnowledgeChange([...knowledge, row])
    setAdding("none")
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-3xl font-semibold tracking-tight text-foreground">
                {project.name}
              </h1>
              {project.visibility === "team" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sage/20 px-2 py-0.5 text-[11px] font-medium text-moss-deep">
                  <Users className="h-3 w-3" /> Team
                </span>
              )}
            </div>
            {project.description && (
              <p className="mt-1 text-sm text-gray-500">{project.description}</p>
            )}
          </div>
          {isOwner && (
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
          )}
        </div>

        {/* New chat CTA */}
        <Button
          onClick={onNewChat}
          className="mt-6 w-full justify-center gap-2 rounded-xl bg-ink py-5 text-ivory hover:bg-moss-deep"
        >
          <Plus className="h-4 w-4" /> New chat in this project
        </Button>

        {/* Instructions */}
        <section className="mt-8">
          <div className="flex items-center gap-2 font-display text-[15px] font-semibold text-foreground">
            <FileText className="h-4 w-4 text-moss" /> Custom instructions
          </div>
          <div className="mt-2 rounded-xl border border-line bg-muted/50 px-4 py-3">
            {project.instructions ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {project.instructions}
              </p>
            ) : isOwner ? (
              <button onClick={onEdit} className="text-sm text-gray-400 hover:text-moss">
                No instructions yet — click to add how ALFRED should behave in this project.
              </button>
            ) : (
              <p className="text-sm text-gray-400">No instructions set for this project.</p>
            )}
          </div>
        </section>

        {/* Knowledge */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-[15px] font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-moss" /> Project knowledge
            </div>
            {isOwner && (
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdding(adding === "client" ? "none" : "client")}
                  className="gap-1.5 border-gray-200 text-gray-600"
                >
                  <Building2 className="h-3.5 w-3.5" /> Attach client
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
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            ALFRED uses everything here as context in every chat in this project.
          </p>

          {adding === "text" && (
            <AddTextKnowledge
              projectId={project.id}
              onAdded={handleAdded}
              onCancel={() => setAdding("none")}
            />
          )}
          {adding === "client" && (
            <AttachClientKnowledge
              projectId={project.id}
              onAdded={handleAdded}
              onCancel={() => setAdding("none")}
            />
          )}

          <div className="mt-3 space-y-2">
            {knowledge.length === 0 && adding === "none" && (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
                No knowledge yet. Paste reference text or attach a client.
              </p>
            )}
            {knowledge.map((row) => (
              <div
                key={row.id}
                className="group flex items-start justify-between gap-3 rounded-xl border border-line bg-paper-2 px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    {row.source_type === "client" ? (
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-moss" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 flex-shrink-0 text-moss" />
                    )}
                    <span className="truncate">{row.title}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">
                    {row.content}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveKnowledge(row)}
                    className="flex-shrink-0 rounded-md p-1 text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Chats in this project */}
        <section className="mt-8 pb-10">
          <div className="flex items-center gap-2 font-display text-[15px] font-semibold text-foreground">
            <MessageSquare className="h-4 w-4 text-moss" /> Chats
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
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span className="truncate text-sm text-gray-700">
                  {conv.title || "Untitled conversation"}
                </span>
                <span className="flex-shrink-0 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
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

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Add a title and some content.")
      return
    }
    onAdded({
      id: crypto.randomUUID(),
      project_id: projectId,
      title: title.trim(),
      content: content.trim(),
      source_type: "manual",
      created_at: new Date().toISOString(),
    })
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-sage/50 bg-sage/10 p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Engagement letter summary)"
        autoFocus
        className="w-full rounded-lg border border-line bg-paper-2 px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="Paste reference text, notes, requirements…"
        className="w-full resize-y rounded-lg border border-line bg-paper-2 px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="border-gray-200">
          Cancel
        </Button>
        <Button size="sm" onClick={handleAdd} className="bg-ink text-ivory hover:bg-moss-deep">
          Add to knowledge
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
  const hits: MockClient[] = term.trim().length >= 2 ? searchMockClients(term) : []

  const handleAttach = (client: MockClient) => {
    const snapshot = buildClientKnowledge(client)
    toast.success(`Attached ${client.name}.`)
    onAdded({
      id: crypto.randomUUID(),
      project_id: projectId,
      title: snapshot.title,
      content: snapshot.content,
      source_type: "client",
      created_at: new Date().toISOString(),
    })
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-sage/50 bg-sage/10 p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search clients & contacts (try Hartwell or Lakeside)…"
          autoFocus
          className="w-full rounded-lg border border-line bg-paper-2 py-2 pl-9 pr-8 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
        />
        <button
          onClick={onCancel}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-300 hover:text-gray-500"
          aria-label="Close client search"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {term.trim().length >= 2 && hits.length === 0 && (
        <p className="px-1 py-1 text-xs text-gray-400">No matching clients found.</p>
      )}
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {hits.map((hit) => (
          <button
            key={`${hit.kind}:${hit.id}`}
            onClick={() => handleAttach(hit)}
            className="flex w-full items-center gap-2.5 rounded-lg bg-paper-2 px-3 py-2 text-left shadow-sm transition-colors hover:bg-muted"
          >
            {hit.kind === "organization" ? (
              <Building2 className="h-4 w-4 flex-shrink-0 text-moss" />
            ) : (
              <Users className="h-4 w-4 flex-shrink-0 text-moss" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-800">{hit.name}</span>
              <span className="block truncate text-xs text-gray-400">{hit.detail}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
