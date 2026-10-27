import type { Metadata } from "next"
import { BrandSheet } from "@/components/brand-sheet/page"
import "./print.css"

export const metadata: Metadata = {
  title: "ALFRED Ai — Brand Identity Sheet",
  description: "ALFRED Ai brand identity, logo, colors, and typography.",
}

export default function BrandSheetPage() {
  return (
    <div className="brand-sheet-stage min-h-screen bg-[#ddd9d0] py-8 print:bg-paper print:py-0">
      <BrandSheet />
      <p className="mx-auto mt-4 w-[8.5in] text-center font-mono text-[10px] uppercase tracking-[0.16em] text-sage print:hidden">ALFRED Ai / Brand Identity Sheet</p>
    </div>
  )
}

export const dynamic = "force-static"
