"use client"

import { useMemo, useState } from "react"
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
import { DEFAULT_MODEL_ID, DEMO_MODELS, type AlfredModel } from "@/lib/models"

/** Static picker. The choice is shown in the trigger but changes nothing. */
export function ModelSelector() {
  const [value, setValue] = useState(DEFAULT_MODEL_ID)
  const current = DEMO_MODELS.find((m) => m.id === value) ?? DEMO_MODELS[0]

  const grouped = useMemo(
    () =>
      DEMO_MODELS.reduce<Record<string, AlfredModel[]>>((acc, model) => {
        ;(acc[model.provider] ??= []).push(model)
        return acc
      }, {}),
    [],
  )

  return (
    <Select value={current.id} onValueChange={setValue}>
      <SelectTrigger
        size="sm"
        className="h-8 w-auto gap-2 rounded-full border-transparent bg-transparent text-xs font-medium text-muted-foreground shadow-none hover:bg-muted hover:text-foreground focus:ring-sage/30"
        aria-label="Select AI model"
      >
        {current.id === DEFAULT_MODEL_ID ? (
          <WandSparkles className="h-3.5 w-3.5 text-brass" aria-hidden />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-moss" aria-hidden />
        )}
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
                  <span className="text-sm font-medium text-foreground">{model.label}</span>
                  {model.hint && (
                    <span className="text-[11px] text-muted-foreground">{model.hint}</span>
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
