import type { Metadata } from "next"
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"
import { HealthDot } from "@/components/alfred-chat/HealthDot"
import { LogoImage } from "@/components/alfred-chat/LogoImage"
import { FIRM_NAME, STAFF_USER } from "@/lib/demo/mock-data"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
})
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" })
const jbMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" })

export const metadata: Metadata = {
  title: "ALFRED Ai — Your firm's right hand",
  description:
    "ALFRED Ai is the AI assistant for CPA firms. Ask about any client, return, or open work and get answers from your firm's live data.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${instrument.variable} ${jbMono.variable} font-sans antialiased bg-paper text-foreground h-screen flex flex-col`}
      >
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
                ALFRED <span className="text-brass">Ai</span>
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
            <div className="flex items-center gap-2.5 border-l border-ivory/10 pl-3">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-moss font-display text-[12px] text-ivory ring-1 ring-brass/40"
              >
                JE
              </span>
              <span className="hidden text-[12px] leading-tight text-ivory/80 md:block">
                <span className="block font-medium">{STAFF_USER}</span>
                <span className="block text-[11px] text-ivory/45">{FIRM_NAME}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 bg-paper">{children}</main>

        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
