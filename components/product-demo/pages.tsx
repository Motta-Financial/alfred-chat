import fs from "node:fs"
import path from "node:path"
import Image from "next/image"

export const demoSteps = [
  {
    title: "Ask in plain English",
    description:
      "Staff open ALFRED Ai and type a question the way they would ask a colleague. Suggested questions help new users get started, and recent conversations stay in the sidebar so work can pick up where it left off.",
  },
  {
    title: "The week at a glance",
    description:
      "Asked about the week ahead, ALFRED Ai lists every client meeting with the day, time, client, and topic, without anyone opening a calendar.",
  },
  {
    title: "A full client picture from one question",
    description:
      "One question returns what is outstanding, what is under review, and what is coming up for a client, along with a suggested next step. The same meeting from the weekly schedule appears here too.",
  },
  {
    title: "Missing documents, with a follow-up ready",
    description:
      "ALFRED Ai finds which clients still owe documents, shows when each was requested, and drafts a short reminder staff can adapt and send.",
  },
  {
    title: "Where a proposal stands",
    description:
      "For prospects, ALFRED Ai reports whether a proposal has been sent, viewed, or signed, and suggests how to follow up.",
  },
]

const pageClass = "demo-page relative flex h-[8.5in] w-[11in] shrink-0 overflow-hidden"

export function CoverPage() {
  return (
    <section className={`${pageClass} bg-moss text-paper`} aria-label="Cover">
      <div className="flex flex-1 flex-col justify-between py-[0.7in] pr-[0.6in] pl-[0.9in]">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="font-display text-[60pt] leading-none font-medium tracking-tight">
            ALFRED Ai
          </h1>
          <p className="mt-[14pt] font-display text-[26pt] leading-tight font-normal text-paper">
            Product demo
          </p>
          <p className="mt-[8pt] text-[14pt] tracking-wide text-paper/90">
            The AI assistant for CPA firms
          </p>
          <div className="mt-[22pt] h-[1.5pt] w-[1.3in] bg-brass" />
          <p className="mt-[22pt] max-w-[5in] text-[11pt] leading-[1.65] text-paper/90">
            These screens come from a demonstration version of ALFRED Ai set up for a fictional
            firm, Brightwater CPA. Every firm, client, staff member, and figure shown is
            fictional. No real client data appears in this document.
          </p>
        </div>
        <div className="flex items-end justify-between text-[9pt] tracking-wide text-paper/80">
          <span>ALFRED Ai — Your firm&apos;s right hand.</span>
          <span>Samprina Zekio · Suffolk University</span>
        </div>
      </div>
      <div className="flex w-[3.3in] shrink-0 items-center justify-center bg-paper">
        <Image
          src="/images/alfred-icon.png"
          alt="ALFRED Ai butler icon"
          width={208}
          height={253}
          priority
          className="h-auto w-[1.32in]"
        />
      </div>
    </section>
  )
}

function ScreenshotFrame({ index, title }: { index: number; title: string }) {
  const file = `${String(index + 1).padStart(2, "0")}.png`
  const exists = fs.existsSync(path.join(process.cwd(), "public", "product-demo", file))

  return (
    <figure className="relative min-h-0 flex-1 overflow-hidden rounded-[8pt] border border-sage bg-paper-2">
      {exists ? (
        <Image
          src={`/product-demo/${file}`}
          alt={`ALFRED Ai screenshot: ${title}`}
          fill
          sizes="9.6in"
          className="object-contain object-top"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-[4pt] text-center">
          <p className="font-mono text-[9pt] tracking-wide text-moss">public/product-demo/{file}</p>
          <p className="text-[9pt] text-ink/60">Screenshot goes here</p>
        </div>
      )}
    </figure>
  )
}

export function DemoPage({ index }: { index: number }) {
  const step = demoSteps[index]
  return (
    <section className={`${pageClass} flex-col bg-paper px-[0.7in] pt-[0.6in] pb-[0.4in] text-ink`}>
      <header className="flex flex-col gap-[8pt]">
        <p className="font-mono text-[9pt] tracking-[0.18em] text-brass">
          {String(index + 1).padStart(2, "0")} / {String(demoSteps.length).padStart(2, "0")}
        </p>
        <h2 className="font-display text-[28pt] leading-[1.1] font-medium tracking-tight text-moss">
          {step.title}
        </h2>
        <div className="h-[1.5pt] w-[1in] bg-brass" />
        <p className="mt-[4pt] max-w-[8.6in] text-[11pt] leading-[1.6] text-ink/85">
          {step.description}
        </p>
      </header>
      <div className="mt-[18pt] flex min-h-0 flex-1 flex-col">
        <ScreenshotFrame index={index} title={step.title} />
      </div>
      <footer className="mt-[14pt] flex items-center justify-between border-t border-line pt-[8pt] text-[8.5pt] tracking-wide text-ink/65">
        <span>ALFRED Ai · Demo with fictional data (Brightwater CPA)</span>
        <span>Samprina Zekio · Suffolk University</span>
      </footer>
    </section>
  )
}
