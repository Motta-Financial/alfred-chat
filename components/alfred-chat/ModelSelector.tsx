"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_MODEL_ID,
  FALLBACK_MODELS,
  fetchHubModels,
  getModelById,
  type AlfredModel,
} from "@/lib/models"
import { createClient } from "@/lib/supabase/client"
import { getBearerToken } from "@/lib/hub"

const STORAGE_KEY = "alfred:selected-model"

interface ModelSelectorProps {
  models: AlfredModel[]
  value: string
  onChange: (id: string) => void
}

export function ModelSelector({ models, value, onChange }: ModelSelectorProps) {
  const current = getModelById(models, value)

  // Group models by provider for the dropdown
  const grouped = useMemo(
    () =>
      models.reduce<Record<string, AlfredModel[]>>((acc, model) => {
        ;(acc[model.provider] ??= []).push(model)
        return acc
      }, {}),
    [models],
  )

  return (
    <Select value={current.id} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        className="h-8 w-auto min-w-[180px] gap-2 border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-[#8E9B79]/60 focus:ring-[#8E9B79]/30"
        aria-label="Select AI model"
      >
        <Sparkles className="h-3.5 w-3.5 text-[#6B745D]" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="max-h-[400px]">
        {Object.entries(grouped).map(([provider, providerModels]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {provider}
            </SelectLabel>
            {providerModels.map((model) => (
              <SelectItem key={model.id} value={model.id} className="py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-gray-800">
                    {model.label}
                  </span>
                  {model.hint && (
                    <span className="text-[11px] text-gray-400">
                      {model.hint}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

export interface ModelCatalog {
  models: AlfredModel[]
  selectedId: string
  setSelectedId: (id: string) => void
}

/**
 * Owns the model catalog and the selected id. The catalog is fetched from
 * the Hub (everything the firm can reach through the Vercel AI Gateway)
 * with a static fallback; the selection persists in localStorage.
 */
export function useModelCatalog(): ModelCatalog {
  const [models, setModels] = useState<AlfredModel[]>(FALLBACK_MODELS)
  const [selectedId, setSelected] = useState<string>(DEFAULT_MODEL_ID)

  useEffect(() => {
    let cancelled = false

    // Restore the persisted choice immediately (re-validated against the
    // live catalog once it arrives).
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) setSelected(stored)

    fetchHubModels(() => getBearerToken(createClient())).then(({ models: live, defaultId }) => {
      if (cancelled) return
      setModels(live)
      setSelected((prev) => (live.some((m) => m.id === prev) ? prev : defaultId))
    })

    return () => {
      cancelled = true
    }
  }, [])

  const setSelectedId = (id: string) => {
    setSelected(id)
    try {
      window.localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Storage unavailable (private mode) — selection still works for the session.
    }
  }

  return { models, selectedId, setSelectedId }
}
