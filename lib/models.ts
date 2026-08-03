// Catalog of AI models exposed in the ALFRED UI.
//
// The authoritative list lives on the Hub (`GET /api/alfred/models`),
// which reflects every model the firm can reach through the Vercel AI
// Gateway. `fetchHubModels()` loads it at runtime; the static list below
// is the fallback when the endpoint is unavailable (or not yet deployed)
// and MUST stay in sync with `ALFRED_CHAT_MODELS` in v0-motta-hub
// (`lib/ai/models.ts`) — the Hub validates `body.model` via
// `isGatewayTextModel()` and silently falls back to its admin-panel
// default on a mismatch. The IDs below are Vercel AI Gateway text-model
// IDs; image models are intentionally excluded because this client
// streams text/tool-use through `/api/alfred/chat`.
//
// Bump procedure when the firm adopts a new chat-capable model:
//   1. Add the id to v0-motta-hub `lib/ai/models.ts` `ALFRED_CHAT_MODELS`.
//   2. Add the matching entry to FALLBACK_MODELS below.
//   3. Optionally update `DEFAULT_MODEL_ID` if the new model becomes
//      the firm's general-purpose default.

import { HUB_MODELS_URL } from "@/lib/hub"

/** Capability flags mirrored from v0-motta-hub `ClaudeModelCapabilities`.
 *  The client uses these to decide whether to show / enable advanced
 *  controls (Deep think toggle, vision attachments, etc.). Keep aligned
 *  with the Hub catalog -- if the two diverge, the worst case is that
 *  the UI shows a control the Hub silently ignores, but staff get
 *  confused. */
export interface AlfredModelCapabilities {
  /** Adaptive thinking. Drives the "Deep think" toggle. */
  supportsThinking: boolean
  /** Image / PDF input. Drives the (future) attachment button. */
  supportsVision: boolean
}

export interface AlfredModel {
  /** Stable id sent to the Hub. Matches the AI Gateway model string. */
  id: string
  /** Human label shown in the dropdown. */
  label: string
  /** Provider grouping for the dropdown (e.g. "Anthropic", "OpenAI"). */
  provider: string
  /** Short hint shown under the label. */
  hint?: string
  /** Provider-level capabilities. See ClaudeModelCapabilities on the Hub.
   *  Defaults to all-false for models the Hub's /api/alfred/models
   *  response doesn't annotate, so an unrecognized model just hides
   *  advanced controls instead of crashing the capability check. */
  capabilities: AlfredModelCapabilities
}

const DEFAULT_CAPABILITIES: AlfredModelCapabilities = {
  supportsThinking: false,
  supportsVision: false,
}

export const FALLBACK_MODELS: AlfredModel[] = [
  {
    id: "anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    hint: "Balanced default — fast and smart",
    capabilities: { supportsThinking: true, supportsVision: true },
  },
  {
    id: "anthropic/claude-opus-4.7",
    label: "Claude Opus 4.7",
    provider: "Anthropic",
    hint: "Deepest reasoning — slower",
    capabilities: { supportsThinking: true, supportsVision: true },
  },
  {
    id: "anthropic/claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    hint: "Fastest — quick lookups",
    // Haiku technically supports thinking but it adds latency without
    // much quality bump at this tier; we still expose the toggle so
    // staff can opt in when they explicitly want it.
    capabilities: { supportsThinking: true, supportsVision: true },
  },
  {
    id: "openai/gpt-5.5-pro",
    label: "GPT-5.5 Pro",
    provider: "OpenAI",
    hint: "OpenAI flagship — deepest reasoning",
    // The Hub's `think` flag only maps to Anthropic adaptive thinking
    // (see DeepThinkToggle.tsx) — not applicable to the OpenAI models.
    capabilities: { supportsThinking: false, supportsVision: true },
  },
  {
    id: "openai/gpt-5.5",
    label: "GPT-5.5",
    provider: "OpenAI",
    hint: "Strong OpenAI general-purpose chat",
    capabilities: { supportsThinking: false, supportsVision: true },
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    provider: "OpenAI",
    hint: "OpenAI reasoning and drafting",
    capabilities: { supportsThinking: false, supportsVision: true },
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "OpenAI",
    hint: "Fast OpenAI responses",
    capabilities: { supportsThinking: false, supportsVision: true },
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    hint: "Compatibility model",
    capabilities: { supportsThinking: false, supportsVision: true },
  },
]

/** Default model id used when the user has not picked one.
 *  Matches `CLAUDE_DEFAULT` / `ALFRED_CHAT_MODEL` on the Hub. */
export const DEFAULT_MODEL_ID = "anthropic/claude-sonnet-4.6"

export function getModelById(models: AlfredModel[], id: string | null | undefined): AlfredModel {
  return (
    (id ? models.find((m) => m.id === id) : undefined) ??
    models.find((m) => m.id === DEFAULT_MODEL_ID) ??
    models[0] ??
    FALLBACK_MODELS[0]
  )
}

interface HubModelsResponse {
  models?: Array<{
    id?: string
    label?: string
    provider?: string
    hint?: string
    capabilities?: Partial<AlfredModelCapabilities>
  }>
  default?: string
}

/**
 * Fetch the live model catalog from the Hub. Returns the models plus the
 * Hub's default id. Any failure (endpoint missing, network, bad shape)
 * falls back to the static list so the picker always renders.
 */
export async function fetchHubModels(
  getToken: () => Promise<string>,
): Promise<{ models: AlfredModel[]; defaultId: string }> {
  const fallback = { models: FALLBACK_MODELS, defaultId: DEFAULT_MODEL_ID }
  if (!HUB_MODELS_URL) return fallback

  try {
    const token = await getToken()
    const res = await fetch(HUB_MODELS_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return fallback

    const body = (await res.json()) as HubModelsResponse
    const models = (body.models ?? [])
      .filter(
        (
          m,
        ): m is {
          id: string
          label: string
          provider?: string
          hint?: string
          capabilities?: Partial<AlfredModelCapabilities>
        } => Boolean(m.id && m.label),
      )
      .map((m) => ({
        id: m.id,
        label: m.label,
        provider: m.provider ?? "Other",
        hint: m.hint,
        capabilities: { ...DEFAULT_CAPABILITIES, ...m.capabilities },
      }))

    if (models.length === 0) return fallback
    const defaultId =
      body.default && models.some((m) => m.id === body.default)
        ? body.default
        : (models.find((m) => m.id === DEFAULT_MODEL_ID)?.id ?? models[0].id)
    return { models, defaultId }
  } catch {
    return fallback
  }
}
