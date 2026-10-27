import type { Metadata } from "next"
import { OnePagerHeader } from "@/components/one-pager/sections"
import {
  IllustrationSection,
  MarketFooter,
  OpportunitySection,
  SourcesSection,
  StatsSection,
  WhoSection,
  WhyNowSection,
} from "@/components/market-opportunity/sections"

export const metadata: Metadata = {
  title: "ALFRED Ai — Market Opportunity",
  description: "The market opportunity for ALFRED Ai, the AI assistant for CPA firms. One printed page, US Letter.",
}

const printCss = `
@page { size: letter; margin: 0; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; background: #F6F4EC !important; }
  .one-pager-stage { padding: 0 !important; background: #F6F4EC !important; }
  .one-pager-sheet { box-shadow: none !important; break-inside: avoid; page-break-after: avoid; }
  .one-pager-sheet, .one-pager-sheet * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`

export default function MarketOpportunityPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printCss }} />
      <div className="one-pager-stage min-h-screen overflow-x-auto bg-line px-4 py-8">
        <main className="one-pager-sheet mx-auto flex h-[11in] w-[8.5in] flex-col overflow-hidden bg-paper shadow-xl">
          <OnePagerHeader subtitle="Market Opportunity" />
          <div className="flex flex-1 flex-col justify-between gap-[6pt] px-[0.75in] pt-[0.22in] pb-[0.22in]">
            <StatsSection />
            <WhoSection />
            <WhyNowSection />
            <IllustrationSection />
            <OpportunitySection />
            <SourcesSection />
            <MarketFooter />
          </div>
        </main>
      </div>
    </>
  )
}
