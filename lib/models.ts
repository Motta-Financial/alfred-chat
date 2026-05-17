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

export interface AlfredModel {
  /** Stable id sent to the Hub. Matches the AI Gateway model string. */
  id: AlfredModelId
  /** Human label shown in the dropdown. */
  label: string
  /** Provider grouping for the dropdown. */
  provider: "Anthropic"
  /** Short hint shown under the label. */
  hint?: string
}

export const ALFRED_MODELS: AlfredModel[] = [
  {
    id: "anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    hint: "Balanced default — fast and smart",
  },
  {
    id: "anthropic/claude-opus-4.7",
    label: "Claude Opus 4.7",
    provider: "Anthropic",
    hint: "Deepest reasoning — slower",
  },
  {
    id: "anthropic/claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    hint: "Fastest — quick lookups",
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
