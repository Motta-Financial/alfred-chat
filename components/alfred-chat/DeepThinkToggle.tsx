"use client"

import { useEffect, useState } from "react"
import { Brain } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "alfred:deep-think"

interface DeepThinkToggleProps {
  /** Whether the toggle is currently on. */
  value: boolean
  /** Called when the user flips the toggle. */
  onChange: (next: boolean) => void
  /** When false, the toggle renders disabled with a tooltip explaining
   *  the selected model doesn't support thinking. We deliberately keep
   *  it visible (rather than hiding it) so the UI doesn't shift around
   *  when staff change models. */
  enabled: boolean
}

/**
 * Compact pill-style toggle that lives next to the model picker.
 * When on, the chat transport sends `{ think: true }` in the body, and
 * the Hub turns on Anthropic adaptive thinking for the next response.
 */
export function DeepThinkToggle({ value, onChange, enabled }: DeepThinkToggleProps) {
  const isOn = enabled && value
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label="Toggle deep thinking"
      title={
        enabled
          ? isOn
            ? "Deep think on — Claude will reason longer before answering"
            : "Deep think off — Claude answers immediately"
          : "Deep think isn't available on this model"
      }
      disabled={!enabled}
      onClick={() => onChange(!value)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-[#8E9B79]/30",
        "disabled:cursor-not-allowed disabled:opacity-40",
        isOn
          ? "border-[#6B745D] bg-[#6B745D] text-white hover:bg-[#4a5240]"
          : "border-gray-200 bg-white text-gray-600 hover:border-[#8E9B79]/60",
      )}
    >
      <Brain className="h-3.5 w-3.5" aria-hidden />
      <span>Deep think</span>
    </button>
  )
}

/**
 * Hook that owns the deep-think on/off state and persists it to
 * localStorage so the choice survives navigation and refreshes.
 *
 * Distinct from `useSelectedModel` so the two state shapes evolve
 * independently -- e.g. we may later add an effort selector without
 * touching the model picker hook.
 */
export function useDeepThink(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "1") setEnabled(true)
  }, [])

  const update = (next: boolean) => {
    setEnabled(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    }
  }

  return [enabled, update]
}
