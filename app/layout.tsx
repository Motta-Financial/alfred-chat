import type { Metadata } from "next"
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"
import { HealthDot } from "@/components/alfred-chat/HealthDot"
import { LogoImage } from "@/components/alfred-chat/LogoImage"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
})
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" })
const jbMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" })

export const metadata: Metadata = {
  title: "ALFRED · Motta",
  description: "Motta Hub Assistant — AI-powered practice management for Motta Financial.",
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
                ALFRED
              </span>
              <span className="hidden text-[11px] uppercase tracking-[0.22em] text-ivory/40 sm:inline">
                Motta Hub Assistant
              </span>
            </div>
          </div>
          <HealthDot />
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 bg-paper">{children}</main>

        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
