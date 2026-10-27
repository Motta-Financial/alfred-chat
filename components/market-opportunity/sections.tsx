import { SectionHeading } from "@/components/one-pager/sections"

const STATS = [
  {
    value: "~50,000",
    text: "CPA firms operate in the U.S., and about 85% have fewer than 10 employees.",
    source: "CPA Trendlines, 2024",
  },
  {
    value: "$132B",
    text: "in annual revenue earned by U.S. offices of certified public accountants.",
    source: "U.S. Census Bureau, 2022",
  },
  {
    value: "300,000+",
    text: "U.S. accountants and auditors left their jobs over about two years, a 17% drop.",
    source: "BLS data via WSJ, 2022",
  },
  {
    value: "31%",
    text: "of managing partners at U.S. accounting firms are over 60, and only 55% of firms have a written succession plan for their leader.",
    source: "INSIDE Public Accounting, 2025",
  },
]

export function StatsSection() {
  return (
    <section aria-labelledby="glance-heading">
      <h2
        id="glance-heading"
        className="mb-[7pt] text-[8pt] font-medium tracking-[0.14em] text-moss uppercase"
      >
        The market at a glance
      </h2>
      <ul className="grid grid-cols-4 gap-[8pt]">
        {STATS.map((stat) => (
          <li
            key={stat.value}
            className="flex flex-col rounded-[4pt] border border-sage bg-paper-2 px-[10pt] py-[8pt]"
          >
            <p className="font-display text-[19pt] leading-none font-medium text-brass">
              {stat.value}
            </p>
            <p className="mt-[5pt] flex-1 text-[8pt] leading-[1.4] text-ink/80">{stat.text}</p>
            <p className="mt-[5pt] font-mono text-[6.5pt] leading-snug text-moss">{stat.source}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function WhoSection() {
  return (
    <section aria-labelledby="who-heading">
      <SectionHeading>
        <span id="who-heading">Who ALFRED Ai serves</span>
      </SectionHeading>
      <p className="text-[10pt] leading-[1.5] text-ink">
        Small and mid-sized CPA firms: the firms that serve households and small businesses who
        need more than do-it-yourself software but are too small for the largest national firms.
        Most are small, yet each one runs on many separate systems for work management,
        proposals and billing, tax preparation, scheduling, client intake, meetings, and
        payments. Finding a simple answer about a client often means checking several of them.
      </p>
    </section>
  )
}

export function WhyNowSection() {
  return (
    <section aria-labelledby="why-now-heading">
      <SectionHeading>
        <span id="why-now-heading">Why now</span>
      </SectionHeading>
      <p className="text-[10pt] leading-[1.5] text-ink">
        Many firm owners are nearing retirement, and fewer people are entering the profession to
        replace them. The supply of new accounting graduates is still shrinking, down to 55,152
        in the 2023–24 academic year, even as most firms plan to keep hiring. Firms must serve
        the same clients with fewer people, and every hour staff spend searching is an hour they
        cannot bill or spend with clients.
      </p>
    </section>
  )
}

export function IllustrationSection() {
  return (
    <section
      aria-label="Illustration of hours saved"
      className="flex items-center gap-[16pt] rounded-[4pt] bg-ink px-[18pt] py-[10pt] text-paper"
    >
      <div className="shrink-0">
        <p className="font-display text-[30pt] leading-none font-medium text-brass">520 hrs</p>
        <p className="mt-[5pt] font-mono text-[7pt] tracking-[0.14em] text-sage uppercase">
          Illustration
        </p>
      </div>
      <p className="text-[10pt] leading-[1.5]">
        If ALFRED Ai saves each person in a 10-person firm just one hour of searching per week,
        the firm gets back about 520 hours a year, roughly a quarter of one full-time employee.
      </p>
    </section>
  )
}

export function OpportunitySection() {
  return (
    <section aria-labelledby="opportunity-heading">
      <SectionHeading>
        <span id="opportunity-heading">The opportunity for ALFRED Ai</span>
      </SectionHeading>
      <p className="text-[10pt] leading-[1.5] text-ink">
        General-purpose AI tools don&rsquo;t know how a CPA firm runs and can&rsquo;t reach its
        live data. ALFRED Ai is built for this market from the start, giving even the smallest
        firms instant answers drawn from all of their systems at once. It is sold by
        subscription, so each new firm adds revenue without rebuilding the product. Beyond CPA
        firms, the same problem exists across the roughly 88,000 U.S. accounting, tax, and
        bookkeeping firms, and in other professional services firms that rely on many
        disconnected tools.
      </p>
    </section>
  )
}

export function SourcesSection() {
  return (
    <p className="font-mono text-[6.5pt] leading-[1.5] text-ink/70">
      <span className="font-medium tracking-[0.1em] text-moss">SOURCES</span>
      {"  "}CPA Trendlines, &ldquo;Almanac: Key Data Points for the Tax, Accounting and Finance
      Profession&rdquo; (2024) · U.S. Census Bureau, Service Annual Survey, Offices of CPAs total
      revenue, 2022 (via FRED) · U.S. Bureau of Labor Statistics data as reported by The Wall
      Street Journal, &ldquo;Why So Many Accountants Are Quitting&rdquo; (2022) · AICPA, 2025
      Trends Report on Accounting Education, the CPA Exam, and Public Accounting Firms&rsquo;
      Hiring · INSIDE Public Accounting, 2025 Practice Management Report, as reported in
      &ldquo;Succession Planning and Generational Shifts: Is Your Firm Ready?&rdquo; (October
      2025). Illustration is a simple estimate: 10 people × 1 hour × 52 weeks.
    </p>
  )
}

export function MarketFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-brass pt-[9pt] text-[8pt] text-ink/75">
      <p>ALFRED Ai — Your firm&apos;s right hand.</p>
      <p>Samprina Zekio · Suffolk University</p>
    </footer>
  )
}
