// Catalog of AI models exposed in the ALFRED UI.
//
// MUST stay in sync with `CLAUDE_MODELS` in v0-motta-hub
// (`lib/ai/models.ts`). The Hub validates `body.model` via
// `isClaudeModel()` and silently falls back to its admin-panel
// default if it doesn't match. Adding a non-Claude model here means
// the dropdown will show it but selecting it is a no-op (the firm
// has standardized on Claude across the board for now).
//
// Bump procedure when the firm adopts a new Claude tier:
//   1. Add the id to v0-motta-hub `lib/ai/models.ts` `CLAUDE_MODELS`.
//   2. Add the matching entry below.
//   3. Optionally update `DEFAULT_MODEL_ID` if the new model becomes
//      the firm's general-purpose default.

export type AlfredModelId =
  | "anthropic/claude-opus-4.7"
  | "anthropic/claude-sonnet-4.6"
  | "anthropic/claude-haiku-4.5"

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
  id: AlfredModelId
  /** Human label shown in the dropdown. */
  label: string
  /** Provider grouping for the dropdown. */
  provider: "Anthropic"
  /** Short hint shown under the label. */
  hint?: string
  /** Provider-level capabilities. See ClaudeModelCapabilities on the Hub. */
  capabilities: AlfredModelCapabilities
}

export const ALFRED_MODELS: AlfredModel[] = [
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
]

/** Default model id used when the user has not picked one.
 *  Matches `CLAUDE_DEFAULT` / `ALFRED_CHAT_MODEL` on the Hub. */
export const DEFAULT_MODEL_ID: AlfredModelId = "anthropic/claude-sonnet-4.6"

export function getModelById(id: string | null | undefined): AlfredModel {
  if (!id) return ALFRED_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!
  return (
    ALFRED_MODELS.find((m) => m.id === id) ??
    ALFRED_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!
  )
}
