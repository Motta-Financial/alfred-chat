"use client"

import { usePathname } from "next/navigation"
import { HealthDot } from "@/components/alfred-chat/HealthDot"
import { LogoImage } from "@/components/alfred-chat/LogoImage"

const STANDALONE_ROUTES = ["/brand"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (STANDALONE_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Dark chrome header — reads as one rail with the sidebar below it */}
      <header className="grain flex flex-shrink-0 items-center justify-between border-b border-brass/15 bg-ink px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink-3 ring-1 ring-brass/40">
            <span
              aria-hidden
              className="absolute font-display text-[15px] leading-none text-ivory/90"
            >
              A
            </span>
            <LogoImage size={30} className="relative rounded-full object-contain" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-xl leading-none tracking-wide text-ivory">
              ALFRED
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.22em] text-ivory/40 sm:inline">
              The AI assistant for CPA firms
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-ivory/5 px-2.5 py-1 text-[11px] font-medium tracking-wide text-ivory/60 ring-1 ring-brass/30">
            Demo · fictional data
          </span>
          <HealthDot />
        </div>
      </header>

      {/* Page content */}
      <main className="min-h-0 flex-1 bg-paper">{children}</main>
    </div>
  )
}
