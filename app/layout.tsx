import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"
import { HealthDot } from "@/components/alfred-chat/HealthDot"
import Image from "next/image"
import { Sparkles } from "lucide-react"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "ALFRED · Motta",
  description: "Motta Hub Assistant — AI-powered practice management for Motta Financial.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#EAE6E1] text-gray-900 h-screen flex flex-col`}
      >
        {/* Top header bar */}
        <header className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/20">
              <Image
                src="/images/alfred-logo.png"
                alt="ALFRED"
                fill
                className="object-contain p-0.5"
                priority
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-white/80" />
              <span className="font-semibold text-white tracking-tight">ALFRED</span>
              <span className="text-white/60 text-sm font-normal">· Motta Hub Assistant</span>
            </div>
          </div>
          <HealthDot />
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 bg-white">{children}</main>

        {/* Small footer */}
        <footer className="flex-shrink-0 text-center py-2 text-xs text-gray-400 bg-[#EAE6E1]">
          © {new Date().getFullYear()} Motta Financial · Internal use only
        </footer>

        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
