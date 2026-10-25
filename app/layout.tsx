import type { Metadata } from "next"
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"

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
    <html lang="en" className="bg-paper">
      <body
        className={`${fraunces.variable} ${instrument.variable} ${jbMono.variable} font-sans antialiased bg-paper text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
