// Catalog of AI models exposed in the ALFRED UI.
//
// The Hub (`v0-motta-hub` /api/alfred/chat) is the source of truth for which
// models actually answer. The client sends the chosen model id in the request
// body as `{ model: "<id>" }`, and the Hub maps it to the corresponding
// AI Gateway model string when constructing `streamText({ model })`.
//
// Models are grouped by provider. Anything in the `zeroConfig` group is
// available out of the box on the Vercel AI Gateway (no extra API key).
// `gatewayKey` models require an `AI_GATEWAY_API_KEY` to be set on the Hub.

export interface AlfredModel {
  /** Stable id sent to the Hub. Matches the AI Gateway model string. */
  id: string
  /** Human label shown in the dropdown. */
  label: string
  /** Provider grouping for the dropdown. */
  provider:
    | "OpenAI"
    | "Anthropic"
    | "Google"
    | "xAI"
    | "Groq"
    | "Fireworks"
  /** Short hint shown under the label. */
  hint?: string
  /** True if available zero-config on the Vercel AI Gateway. */
  zeroConfig: boolean
}

export const ALFRED_MODELS: AlfredModel[] = [
  // OpenAI (zero-config)
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    provider: "OpenAI",
    hint: "Most capable",
    zeroConfig: true,
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "OpenAI",
    hint: "Fast, cost-efficient",
    zeroConfig: true,
  },
  {
    id: "openai/gpt-4.1",
    label: "GPT-4.1",
    provider: "OpenAI",
    hint: "Long context",
    zeroConfig: true,
  },

  // Anthropic (zero-config)
  {
    id: "anthropic/claude-opus-4.6",
    label: "Claude Opus 4.6",
    provider: "Anthropic",
    hint: "Best for reasoning",
    zeroConfig: true,
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    hint: "Balanced",
    zeroConfig: true,
  },

  // Google (zero-config)
  {
    id: "google/gemini-3-pro",
    label: "Gemini 3 Pro",
    provider: "Google",
    hint: "Most capable Gemini",
    zeroConfig: true,
  },
  {
    id: "google/gemini-3-flash",
    label: "Gemini 3 Flash",
    provider: "Google",
    hint: "Fast multimodal",
    zeroConfig: true,
  },

  // xAI (requires AI_GATEWAY_API_KEY on Hub)
  {
    id: "xai/grok-4",
    label: "Grok 4",
    provider: "xAI",
    hint: "Requires Gateway key",
    zeroConfig: false,
  },

  // Groq (requires AI_GATEWAY_API_KEY on Hub)
  {
    id: "groq/llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    provider: "Groq",
    hint: "Ultra-fast inference",
    zeroConfig: false,
  },
]

/** Default model id used when the user has not picked one. */
export const DEFAULT_MODEL_ID = "openai/gpt-5-mini"

export function getModelById(id: string | null | undefined): AlfredModel {
  if (!id) return ALFRED_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!
  return (
    ALFRED_MODELS.find((m) => m.id === id) ??
    ALFRED_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!
  )
}
