// Static model list shown in the demo's model picker. Selecting a model is
// cosmetic: replies are scripted and no model is ever called.

export interface AlfredModel {
  id: string
  label: string
  provider: string
  hint?: string
}

export const DEMO_MODELS: AlfredModel[] = [
  {
    id: "auto",
    label: "Auto",
    provider: "ALFRED",
    hint: "Picks the best model for each prompt",
  },
  {
    id: "claude-sonnet",
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    hint: "Balanced default — fast and smart",
  },
  {
    id: "claude-opus",
    label: "Claude Opus 4.7",
    provider: "Anthropic",
    hint: "Deepest reasoning — slower",
  },
  {
    id: "claude-haiku",
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    hint: "Fastest — quick lookups",
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    provider: "OpenAI",
    hint: "OpenAI reasoning and drafting",
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "OpenAI",
    hint: "Fast OpenAI responses",
  },
]

export const DEFAULT_MODEL_ID = "auto"
