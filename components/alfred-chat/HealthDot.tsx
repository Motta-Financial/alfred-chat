"use client"

import { useEffect, useState } from "react"
import { HUB_CHAT_URL } from "@/lib/hub"

type Status = "unknown" | "ok" | "error"

const HEALTH_URL = HUB_CHAT_URL?.replace("/chat", "/health") ?? ""
const PING_INTERVAL_MS = 60_000

export function HealthDot() {
  const [status, setStatus] = useState<Status>("unknown")

  useEffect(() => {
    if (!HEALTH_URL) return

    async function ping() {
      // Don't burn requests while the tab is in the background.
      if (document.hidden) return
      try {
        const res = await fetch(HEALTH_URL, { cache: "no-store" })
        setStatus(res.ok ? "ok" : "error")
      } catch {
        setStatus("error")
      }
    }

    ping()
    const id = setInterval(ping, PING_INTERVAL_MS)
    // Refresh immediately when the user returns to the tab.
    document.addEventListener("visibilitychange", ping)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", ping)
    }
  }, [])

  const color =
    status === "ok"
      ? "bg-green-400"
      : status === "error"
        ? "bg-red-400"
        : "bg-gray-300"

  const label =
    status === "ok" ? "Hub online" : status === "error" ? "Hub unreachable" : "Checking…"

  return (
    <span className="flex items-center gap-1.5 text-xs text-white/70" title={label}>
      <span className={`w-2 h-2 rounded-full ${color} transition-colors`} />
      {label}
    </span>
  )
}
