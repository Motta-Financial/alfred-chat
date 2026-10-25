import type { Metadata } from "next"
import { Wordmark } from "@/components/brand/Wordmark"

export const metadata: Metadata = {
  title: "ALFRED Ai Brand Sheet",
  description: "Brand identity sheet for ALFRED Ai™ — the AI assistant for CPA firms.",
}

const backgrounds = [
  { caption: "On Cream", bg: "bg-[#F6F4EC] border border-[#171C14]/10", ink: "text-[#171C14]" },
  { caption: "On Olive", bg: "bg-[#5F6A51]", ink: "text-[#F6F4EC]" },
  { caption: "On Forest", bg: "bg-[#171C14]", ink: "text-[#F6F4EC]" },
]

const swatches = [
  { name: "Olive", role: "Primary", hex: "#5F6A51", border: false },
  { name: "Sage", role: "Secondary", hex: "#8E9B79", border: false },
  { name: "Gold", role: "Accent", hex: "#B49B6C", border: false },
  { name: "Cream", role: "Background", hex: "#F6F4EC", border: true },
  { name: "Forest Black", role: "Text", hex: "#171C14", border: false },
]

const typefaces = [
  {
    name: "Fraunces",
    role: "Headings",
    sample: "Your firm\u2019s right hand.",
    className: "font-display text-4xl sm:text-5xl leading-tight",
  },
  {
    name: "Instrument Sans",
    role: "Body",
    sample: "Ask a question in plain English and get an answer from your firm\u2019s live data.",
    className: "font-sans text-2xl sm:text-3xl leading-snug",
  },
  {
    name: "JetBrains Mono",
    role: "Data",
    sample: "Open returns: 42 | Due this week: 7",
    className: "font-mono text-xl sm:text-2xl leading-snug",
  },
]

function SectionTitle({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2
      id={id}
      className="mb-10 border-b border-[#B49B6C] pb-3 font-display text-2xl font-medium text-[#171C14]"
    >
      {children}
    </h2>
  )
}

export default function BrandPage() {
  return (
    <div
      className="min-h-screen bg-[#F6F4EC] text-[#171C14] print:min-h-0"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-20 px-6 py-16 sm:px-10 sm:py-24 print:gap-12 print:py-8">
        <header
          aria-labelledby="brand-logo"
          className="flex flex-col items-center gap-6 text-center break-inside-avoid"
        >
          <h1 id="brand-logo" className="sr-only">
            ALFRED Ai Brand Sheet
          </h1>
          <Wordmark className="text-7xl sm:text-8xl" />
          <p className="font-display text-2xl italic sm:text-3xl">Your firm&apos;s right hand.</p>
          <p className="font-sans text-xs uppercase tracking-[0.28em] text-[#8E9B79] sm:text-sm">
            The AI assistant for CPA firms.
          </p>
        </header>

        <section aria-labelledby="backgrounds" className="break-inside-avoid">
          <SectionTitle id="backgrounds">Logo on Backgrounds</SectionTitle>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 print:grid-cols-3">
            {backgrounds.map((b) => (
              <figure key={b.caption} className="flex flex-col gap-3">
                <div
                  className={`flex h-40 items-center justify-center rounded-2xl px-4 ${b.bg}`}
                >
                  <Wordmark className="text-4xl" inkClassName={b.ink} />
                </div>
                <figcaption className="text-center font-sans text-sm text-[#8E9B79]">
                  {b.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section aria-labelledby="palette" className="break-inside-avoid">
          <SectionTitle id="palette">Color Palette</SectionTitle>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-5 print:grid-cols-5">
            {swatches.map((s) => (
              <li key={s.hex} className="flex flex-col gap-3">
                <div
                  className={`h-36 rounded-2xl ${s.border ? "border border-[#171C14]/20" : ""}`}
                  style={{ backgroundColor: s.hex }}
                  role="img"
                  aria-label={`${s.name} swatch ${s.hex}`}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-base font-medium">{s.name}</span>
                  <span className="font-sans text-sm text-[#8E9B79]">{s.role}</span>
                  <span className="font-mono text-sm">{s.hex}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="typography" className="break-inside-avoid">
          <SectionTitle id="typography">Typography</SectionTitle>
          <div className="flex flex-col gap-10">
            {typefaces.map((t) => (
              <div key={t.name} className="flex flex-col gap-3">
                <p className="font-mono text-xs uppercase tracking-wider text-[#5F6A51]">
                  {t.name} <span className="text-[#8E9B79]">&mdash; {t.role}</span>
                </p>
                <p className={`text-pretty ${t.className}`}>{t.sample}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="break-inside-avoid border-t border-[#B49B6C]/40 pt-8 text-center font-sans text-xs text-[#5F6A51]">
          ALFRED Ai™ — Brand Identity Sheet · © 2026 Samprina Zekio. All rights reserved.
        </footer>
      </main>
    </div>
  )
}
