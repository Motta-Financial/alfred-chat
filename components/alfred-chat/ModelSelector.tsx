"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles, WandSparkles } from "lucide-react"
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
  AUTO_MODEL_ID,
  FALLBACK_MODELS,
  fetchHubModels,
  getModelById,
  withAutoModel,
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
        className="h-8 w-auto gap-2 rounded-full border-transparent bg-transparent text-xs font-medium text-muted-foreground shadow-none hover:bg-muted hover:text-foreground focus:ring-sage/30"
        aria-label="Select AI model"
      >
        {current.id === AUTO_MODEL_ID ? (
          <WandSparkles className="h-3.5 w-3.5 text-brass" aria-hidden />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-moss" aria-hidden />
        )}
        {/* Render only the label — the stacked label+hint block belongs in
            the dropdown, not the slim console row. */}
        <SelectValue>{current.label}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="max-h-[400px]">
        {Object.entries(grouped).map(([provider, providerModels]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
              {provider}
            </SelectLabel>
            {providerModels.map((model) => (
              <SelectItem key={model.id} value={model.id} className="py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {model.label}
                  </span>
                  {model.hint && (
                    <span className="text-[11px] text-muted-foreground">
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
  // The virtual "Auto" entry heads every catalog (static and live) and is
  // the default selection — routeAutoModel() resolves it per prompt.
  const [models, setModels] = useState<AlfredModel[]>(withAutoModel(FALLBACK_MODELS))
  const [selectedId, setSelected] = useState<string>(AUTO_MODEL_ID)

  useEffect(() => {
    let cancelled = false

    // Restore the persisted choice immediately (re-validated against the
    // live catalog once it arrives).
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) setSelected(stored)

    fetchHubModels(() => getBearerToken(createClient())).then(({ models: live }) => {
      if (cancelled) return
      const merged = withAutoModel(live)
      setModels(merged)
      // A stale stored id (model retired from the gateway) falls back to
      // Auto rather than the Hub default — Auto re-routes per prompt, so
      // it is always valid.
      setSelected((prev) => (merged.some((m) => m.id === prev) ? prev : AUTO_MODEL_ID))
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
