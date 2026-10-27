import type { Metadata } from "next"
import { CoverPage, DemoPage, demoSteps } from "@/components/product-demo/pages"

export const metadata: Metadata = {
  title: "ALFRED Ai — Product Demo",
  description:
    "A walkthrough of ALFRED Ai, the AI assistant for CPA firms, using a demonstration firm with fictional data.",
}

const printCss = `
@page { size: 11in 8.5in; margin: 0; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; background: #F6F4EC !important; }
  .demo-stage { padding: 0 !important; gap: 0 !important; background: #F6F4EC !important; }
  .demo-page { box-shadow: none !important; break-after: page; page-break-after: always; }
  .demo-page:last-child { break-after: auto; page-break-after: auto; }
  .demo-page, .demo-page * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`

export default function ProductDemoPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printCss }} />
      <main className="demo-stage flex min-h-screen flex-col items-center gap-8 overflow-x-auto bg-line px-4 py-8">
        <CoverPage />
        {demoSteps.map((step, index) => (
          <DemoPage key={step.title} index={index} />
        ))}
      </main>
    </>
  )
}
