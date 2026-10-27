import Image from "next/image"

const colors = [
  { name: "Olive", role: "Primary", hex: "#5F6A51", className: "bg-moss" },
  { name: "Sage", role: "Secondary", hex: "#8E9B79", className: "bg-sage" },
  { name: "Gold", role: "Accent", hex: "#B49B6C", className: "bg-brass" },
  { name: "Cream", role: "Background", hex: "#F6F4EC", className: "bg-paper" },
  { name: "Forest Black", role: "Text", hex: "#171C14", className: "bg-ink" },
]

function LogoCard({ tone, label, logoClass }: { tone: string; label: string; logoClass: string }) {
  return (
    <div className={`flex h-[1.42in] items-center justify-center ${tone}`}>
      <div className={`relative flex items-center gap-[5pt] ${logoClass}`}>
        <Image src="/images/alfred-icon.png" alt="ALFRED Ai logo" width={225} height={276} className="h-[60pt] w-auto object-contain" />
        <span className="absolute right-[-10pt] top-[-2pt] text-[8pt] font-semibold">™</span>
      </div>
      <span className="absolute sr-only">{label}</span>
    </div>
  )
}

export function BrandSheet() {
  return (
    <main className="brand-sheet mx-auto flex min-h-[11in] w-[8.5in] flex-col overflow-hidden bg-paper text-ink shadow-2xl print:shadow-none">
      <header className="flex items-end justify-between border-b border-ink/15 px-[0.62in] pb-[0.28in] pt-[0.42in]">
        <div>
          <p className="font-mono text-[7.5pt] uppercase tracking-[0.28em] text-sage">Identity system / 2026</p>
          <h1 className="mt-[5pt] font-display text-[32pt] leading-none font-medium tracking-[-0.03em]">ALFRED<span className="text-brass"> Ai</span><sup className="ml-[2pt] align-super font-sans text-[8pt]">™</sup></h1>
          <p className="mt-[7pt] font-display text-[15pt] italic text-sage">Your firm&apos;s right hand.</p>
        </div>
        <p className="max-w-[1.6in] text-right text-[8.5pt] leading-relaxed text-sage">A clear, considered identity for the AI assistant built for CPA firms.</p>
      </header>

      <section className="px-[0.62in] pt-[0.28in]">
        <div className="mb-[10pt] flex items-end justify-between">
          <div>
            <p className="font-mono text-[7pt] uppercase tracking-[0.22em] text-brass">01 / Marks</p>
            <h2 className="mt-[4pt] font-display text-[18pt] leading-none">Logo on backgrounds</h2>
          </div>
          <p className="text-[8pt] text-sage">Use the full mark whenever space allows.</p>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-[5pt] border border-ink/10">
          <LogoCard tone="relative bg-paper" label="On Cream" logoClass="text-ink" />
          <LogoCard tone="relative bg-moss" label="On Olive" logoClass="text-paper" />
          <LogoCard tone="relative bg-ink" label="On Forest" logoClass="text-paper" />
        </div>
        <div className="grid grid-cols-3 text-center font-mono text-[6.5pt] uppercase tracking-[0.16em] text-sage">
          <span className="pt-[5pt]">On Cream</span><span className="pt-[5pt]">On Olive</span><span className="pt-[5pt]">On Forest</span>
        </div>
      </section>

      <section className="px-[0.62in] pt-[0.32in]">
        <div className="mb-[10pt]">
          <p className="font-mono text-[7pt] uppercase tracking-[0.22em] text-brass">02 / Palette</p>
          <h2 className="mt-[4pt] font-display text-[18pt] leading-none">Color palette</h2>
        </div>
        <div className="grid grid-cols-5 gap-[5pt]">
          {colors.map((color) => <div key={color.name}><div className={`h-[0.6in] rounded-[4pt] ${color.className}`} /><p className="mt-[6pt] text-[8pt] font-semibold">{color.name}</p><p className="mt-[2pt] font-mono text-[6.5pt] uppercase tracking-[0.08em] text-sage">{color.role}</p><p className="mt-[4pt] font-mono text-[7pt] text-ink">{color.hex}</p></div>)}
        </div>
      </section>

      <section className="mt-auto grid grid-cols-[1.1fr_1fr] gap-[0.42in] px-[0.62in] pb-[0.3in] pt-[0.36in]">
        <div>
          <p className="font-mono text-[7pt] uppercase tracking-[0.22em] text-brass">03 / Type</p>
          <h2 className="mt-[4pt] font-display text-[18pt] leading-none">Typography</h2>
          <div className="mt-[14pt] border-t border-ink/15 pt-[9pt]"><p className="font-mono text-[6.5pt] uppercase tracking-[0.16em] text-sage">Fraunces — headings</p><p className="mt-[5pt] font-display text-[18pt] leading-tight">Your firm&apos;s right hand.</p></div>
          <div className="mt-[15pt] border-t border-ink/15 pt-[9pt]"><p className="font-mono text-[6.5pt] uppercase tracking-[0.16em] text-sage">Instrument Sans — body</p><p className="mt-[5pt] text-[10pt] leading-relaxed">Ask a question in plain English and get an answer from your firm&apos;s live data.</p></div>
        </div>
        <div className="self-end border-l border-brass pl-[0.24in]"><p className="font-mono text-[6.5pt] uppercase tracking-[0.16em] text-sage">JetBrains Mono — data</p><p className="mt-[7pt] font-mono text-[10pt] leading-relaxed">Open returns: 42<br />Due this week: 7</p><div className="mt-[0.36in] border-t border-ink/15 pt-[8pt] text-[7pt] leading-relaxed text-sage">ALFRED Ai™ — Brand Identity Sheet</div></div>
      </section>
    </main>
  )
}
