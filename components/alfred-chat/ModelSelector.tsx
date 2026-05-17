"use client"

import { useEffect, useState } from "react"
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
  ALFRED_MODELS,
  DEFAULT_MODEL_ID,
  getModelById,
  type AlfredModel,
} from "@/lib/models"

const STORAGE_KEY = "alfred:selected-model"

interface ModelSelectorProps {
  value: string
  onChange: (id: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const current = getModelById(value)

  // Group models by provider for the dropdown
  const grouped = ALFRED_MODELS.reduce<Record<string, AlfredModel[]>>(
    (acc, model) => {
      ;(acc[model.provider] ??= []).push(model)
      return acc
    },
    {},
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
        {Object.entries(grouped).map(([provider, models]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {provider}
            </SelectLabel>
            {models.map((model) => (
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

/**
 * Hook that owns the selected model id and persists it to localStorage so the
 * choice survives navigation and refreshes.
 */
export function useSelectedModel(): [string, (id: string) => void] {
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID)

  // Load persisted choice on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && ALFRED_MODELS.some((m) => m.id === stored)) {
      setModelId(stored)
    }
  }, [])

  const update = (id: string) => {
    setModelId(id)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id)
    }
  }

  return [modelId, update]
}
