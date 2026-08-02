import { ChatPage } from "@/components/alfred-chat/ChatPage"

// The chat surface is auth-gated and per-user — there is nothing to
// statically prerender. force-dynamic keeps the build from evaluating the
// Supabase browser client at build time (where env vars may be absent).
export const dynamic = "force-dynamic"

export default function Page() {
  return <ChatPage />
}
