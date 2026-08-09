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

/** Default concrete model id — the router's "balanced" tier and the
 *  fallback wherever a real gateway id is required.
 *  Matches `CLAUDE_DEFAULT` / `ALFRED_CHAT_MODEL` on the Hub. */
export const DEFAULT_MODEL_ID = "anthropic/claude-sonnet-4.6"

/* ------------------------------------------------------------------ */
/* Auto model routing                                                  */
/*                                                                     */
/* "Auto" is a VIRTUAL entry that exists only in this client. The Hub  */
/* validates body.model via isGatewayTextModel() and silently falls    */
/* back on a mismatch, so the auto id is never sent over the wire —    */
/* routeAutoModel() resolves it to a concrete catalog id per prompt    */
/* right before each send.                                             */
/* ------------------------------------------------------------------ */

export const AUTO_MODEL_ID = "auto"

export const AUTO_MODEL: AlfredModel = {
  id: AUTO_MODEL_ID,
  label: "Auto",
  provider: "ALFRED",
  hint: "Picks the best model for each prompt",
  // Deep think stays available — the router honours it when resolving.
  capabilities: { supportsThinking: true, supportsVision: true },
}

/** Prepend the virtual Auto entry (idempotent). */
export function withAutoModel(models: AlfredModel[]): AlfredModel[] {
  return models.some((m) => m.id === AUTO_MODEL_ID) ? models : [AUTO_MODEL, ...models]
}

/** Multi-step / analysis work that deserves a stronger model. */
const HEAVY_SIGNAL =
  /\b(analy[sz]e|review|audit|reconcil\w*|research|strateg\w*|forecast|projection|valuation|memo|plan\b|step[ -]?by[ -]?step|thorough|comprehensive|detailed|compare|restructur\w*|multi[ -]?state|scenario)\b/i
/** Statute/regulation citations — tax research prompts. */
const CITATION_SIGNAL = /§|\birc\s*\d|\bsec(?:tion)?\.?\s*\d{2,}|\breg(?:ulation)?s?\.?\s*\d/i
/** Code or SQL in the prompt. */
const CODE_SIGNAL = /```|\b(function|const|class)\s|\bselect\b[\s\S]{0,120}?\bfrom\b/i

/**
 * Resolve the virtual Auto model to a concrete catalog entry for one
 * prompt. Deliberately conservative: the balanced tier is the default,
 * the light tier only takes clearly-simple lookups, and the heavy tier
 * only explicit deep/analysis work (or Deep think on a complex prompt).
 */
export function routeAutoModel(
  prompt: string,
  models: AlfredModel[],
  deepThink: boolean,
): AlfredModel {
  const pool = models.filter((m) => m.id !== AUTO_MODEL_ID)
  const find = (needle: string) => pool.find((m) => m.id.includes(needle))
  const balanced =
    find("sonnet") ?? pool.find((m) => m.id === DEFAULT_MODEL_ID) ?? pool[0] ?? FALLBACK_MODELS[0]
  const light = find("haiku") ?? find("mini")
  const heavy = find("opus") ?? balanced

  const text = prompt.trim()
  const words = text.split(/\s+/).length
  const isHeavy = HEAVY_SIGNAL.test(text) || CITATION_SIGNAL.test(text) || CODE_SIGNAL.test(text)

  if (deepThink) {
    // `think` only maps to Anthropic adaptive thinking on the Hub, so
    // route within thinking-capable models.
    const thinkers = pool.filter((m) => m.capabilities.supportsThinking)
    const thinkBalanced = thinkers.find((m) => m.id.includes("sonnet")) ?? thinkers[0] ?? balanced
    const thinkHeavy = thinkers.find((m) => m.id.includes("opus")) ?? thinkBalanced
    return isHeavy || words > 150 ? thinkHeavy : thinkBalanced
  }

  if (isHeavy && (words > 150 || /\b(thorough|comprehensive|deep|detailed)\b/i.test(text))) {
    return heavy
  }
  // Short, plain lookups → fastest tier.
  if (light && words <= 25 && !isHeavy) {
    return light
  }
  return balanced
}

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
