"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  createProject,
  updateProject,
  type ProjectRow,
} from "@/lib/supabase/queries"

interface ProjectDialogProps {
  open: boolean
  /** When set, the dialog edits this project; otherwise it creates one. */
  project?: ProjectRow | null
  onClose: () => void
  onSaved: (project: ProjectRow) => void
}

export function ProjectDialog({ open, project, onClose, onSaved }: ProjectDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [shared, setShared] = useState(false)
  const [saving, setSaving] = useState(false)

  // Re-seed the form whenever the dialog opens
  useEffect(() => {
    if (!open) return
    setName(project?.name ?? "")
    setDescription(project?.description ?? "")
    setInstructions(project?.instructions ?? "")
    setShared(project?.visibility === "team")
  }, [open, project])

  if (!open) return null

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Give the project a name.")
      return
    }
    setSaving(true)
    try {
      const input = {
        name,
        description,
        instructions,
        visibility: (shared ? "team" : "private") as "team" | "private",
      }
      const saved = project
        ? await updateProject(project.id, input)
        : await createProject(input)
      onSaved(saved)
      onClose()
      toast.success(project ? "Project updated." : "Project created.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the project.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project ? "Edit project" : "Create project"}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {project ? "Edit project" : "Create a project"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <label htmlFor="project-name" className="text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp 2026 tax planning"
              autoFocus
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[#8E9B79] focus:ring-2 focus:ring-[#8E9B79]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-description" className="text-sm font-medium text-gray-700">
              Description <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[#8E9B79] focus:ring-2 focus:ring-[#8E9B79]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-instructions" className="text-sm font-medium text-gray-700">
              Custom instructions <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="project-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              placeholder={
                "Tell ALFRED how to behave in this project.\ne.g. You are helping with Acme Corp's S-corp return. Always cite IRC sections. The client's fiscal year ends June 30."
              }
              className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[#8E9B79] focus:ring-2 focus:ring-[#8E9B79]/20"
            />
            <p className="text-xs text-gray-400">
              Applied to every chat in this project, like Claude project instructions.
            </p>
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#6B745D]"
            />
            <span className="text-sm text-gray-700">
              Share with the team
              <span className="block text-xs text-gray-400">
                Teammates can view this project and start their own chats in it.
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={onClose} className="border-gray-200">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-[#6B745D] text-white hover:bg-[#4a5240]"
          >
            {saving ? "Saving…" : project ? "Save changes" : "Create project"}
          </Button>
        </div>
      </div>
    </div>
  )
}
