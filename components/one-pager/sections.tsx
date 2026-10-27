import Image from "next/image"

const ANSWER_TOPICS = [
  "Clients",
  "Work in progress",
  "Tax returns",
  "Proposals",
  "Billing",
  "Meetings",
]

const EXAMPLE_QUESTIONS = [
  "Where does the Hartwell family's 2025 tax return stand?",
  "What work is still open for Lakeside Bakery?",
  "What did we discuss with Rivera Dental in last week's meeting?",
]

const TOOL_CATEGORIES = [
  { label: "Practice management", detail: "Platforms like Karbon" },
  { label: "Meetings", detail: "Platforms like Zoom" },
  { label: "Tax preparation", detail: "Through the provider's official integration" },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[7pt]">
      <h2 className="font-display text-[17pt] leading-none font-medium tracking-tight text-moss">
        {children}
      </h2>
      <div className="mt-[5pt] h-px w-[0.6in] bg-brass" />
    </div>
  )
}

export function OnePagerHeader() {
  return (
    <header className="bg-moss px-[0.75in] pt-[0.45in] pb-[0.32in] text-paper">
      <div className="flex items-center gap-[10pt]">
        <Image
          src="/images/alfred-icon.png"
          alt=""
          width={208}
          height={253}
          priority
          className="h-[35pt] w-auto"
        />
        <h1 className="font-display text-[42pt] leading-none font-medium tracking-tight">
          ALFRED Ai
        </h1>
      </div>
      <p className="mt-[8pt] text-[13pt] leading-snug tracking-wide text-paper/90">
        The AI assistant for CPA firms
      </p>
      <div className="mt-[14pt] h-[1.5pt] w-[1.1in] bg-brass" />
    </header>
  )
}

export function ProblemSection() {
  return (
    <section aria-labelledby="problem-heading">
      <SectionHeading>
        <span id="problem-heading">The problem</span>
      </SectionHeading>
      <div className="flex items-stretch gap-[0.3in]">
        <p className="flex-1 text-[10pt] leading-[1.55] text-ink">
          Small and mid-sized CPA firms run on many separate systems for work management,
          proposals and billing, tax preparation, scheduling, client intake, meetings, and
          payments. When staff need a simple answer about a client, they often have to search
          several tools.
        </p>
        <figure className="flex w-[2.35in] shrink-0 flex-col justify-center rounded-[4pt] border border-sage bg-paper-2 px-[12pt] py-[9pt]">
          <p className="font-display text-[28pt] leading-none font-medium text-brass">
            9.3 hours
          </p>
          <figcaption className="mt-[5pt] text-[8pt] leading-[1.4] text-ink/75">
            per week the average employee spends searching for and gathering information
            (McKinsey Global Institute)
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

export function SolutionSection() {
  return (
    <section aria-labelledby="solution-heading">
      <SectionHeading>
        <span id="solution-heading">The solution</span>
      </SectionHeading>
      <p className="text-[10pt] leading-[1.55] text-ink">
        ALFRED Ai brings a firm&apos;s systems together in one place. Staff ask questions in
        plain English and get answers from the firm&apos;s live data in seconds. Instead of
        checking eight tools, they ask one question.
      </p>
    </section>
  )
}

export function AnswersSection() {
  return (
    <section aria-labelledby="answers-heading">
      <SectionHeading>
        <span id="answers-heading">What ALFRED can answer</span>
      </SectionHeading>
      <ul className="grid grid-cols-2 gap-x-[10pt] gap-y-[8pt]">
        {ANSWER_TOPICS.map((topic) => (
          <li
            key={topic}
            className="flex items-center gap-[9pt] rounded-[4pt] border border-sage bg-paper px-[12pt] py-[9pt]"
          >
            <span aria-hidden className="h-[1.5pt] w-[12pt] bg-brass" />
            <span className="font-display text-[11.5pt] leading-none text-ink">{topic}</span>
          </li>
        ))}
      </ul>
      <p className="mt-[8pt] text-[9pt] leading-snug text-ink/75">
        Plus saved conversation history and secure access tied to each staff member&apos;s firm
        login.
      </p>
    </section>
  )
}

export function ExamplesSection() {
  return (
    <section aria-labelledby="examples-heading">
      <h2
        id="examples-heading"
        className="mb-[6pt] text-[8pt] font-medium tracking-[0.14em] text-moss uppercase"
      >
        Example questions from a demo firm, Brightwater CPA
      </h2>
      <div className="rounded-[4pt] bg-ink px-[16pt] py-[13pt] text-paper">
        <ul className="flex flex-col gap-[8pt] font-mono text-[9pt] leading-[1.45]">
          {EXAMPLE_QUESTIONS.map((q) => (
            <li key={q} className="flex gap-[7pt]">
              <span aria-hidden className="text-brass">
                {">"}
              </span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function ToolsSection() {
  return (
    <section aria-labelledby="tools-heading">
      <SectionHeading>
        <span id="tools-heading">Connects to the tools firms already use</span>
      </SectionHeading>
      <ul className="flex flex-col divide-y divide-brass sm:flex-row sm:divide-x sm:divide-y-0">
        {TOOL_CATEGORIES.map((tool) => (
          <li
            key={tool.label}
            className="flex-1 py-[6pt] first:pt-0 last:pb-0 sm:px-[12pt] sm:py-0 sm:first:pl-0 sm:last:pr-0"
          >
            <p className="text-[10pt] leading-snug font-semibold text-ink">{tool.label}</p>
            <p className="mt-[2pt] text-[9.5pt] leading-[1.4] font-normal text-ink">
              {tool.detail}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-[8pt] text-[8.5pt] leading-snug text-sage">
        Every firm uses different tools. ALFRED Ai connects to the ones each firm already has.
      </p>
    </section>
  )
}

export function OnePagerFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-brass pt-[9pt] text-[8pt] text-ink/75">
      <p>ALFRED Ai — Your firm&apos;s right hand.</p>
      <p>Created by Samprina Zekio · Suffolk University</p>
    </footer>
  )
}
