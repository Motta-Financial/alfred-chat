"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { memo, useState } from "react"

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

// Hoisted to module scope: these are static, and rebuilding them on every
// render forces react-markdown to treat every element renderer as new.
const remarkPlugins = [remarkGfm]

const components: Components = {
    // Headers — display serif for an editorial, printed feel
    h1: ({ children }) => (
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-4 mt-6 border-b border-border pb-2">{children}</h1>
    ),
    h2: ({ children }) => <h2 className="font-display text-xl font-semibold tracking-tight mb-3 mt-5">{children}</h2>,
    h3: ({ children }) => <h3 className="font-display text-lg font-semibold tracking-tight mb-2 mt-4">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-3">{children}</h4>,

    // Paragraphs with proper spacing
    p: ({ children, node }) => {
      // Check if this paragraph is inside a list item
      const isInListItem = node?.position?.start.line === node?.position?.end.line
      return <p className={`leading-relaxed ${isInListItem ? "inline" : "mb-3 last:mb-0"}`}>{children}</p>
    },

    // Strong/bold text — inherits color so it stays legible inside the
    // dark user bubble as well as on the paper canvas.
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,

    // Emphasis/italic text
    em: ({ children }) => <em className="italic">{children}</em>,

    // Unordered lists
    ul: ({ children }) => <ul className="list-disc ml-6 mb-3 space-y-1.5 [&>li]:pl-1">{children}</ul>,

    // Ordered lists
    ol: ({ children }) => <ol className="list-decimal ml-6 mb-3 space-y-1.5 [&>li]:pl-1">{children}</ol>,

    // List items
    li: ({ children }) => <li className="leading-relaxed [&>p]:inline [&>p]:m-0">{children}</li>,

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium"
      >
        {children}
      </a>
    ),

    // Blockquotes — brass thread, like a margin note
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-brass/60 pl-4 py-1 my-3 italic text-muted-foreground">
        {children}
      </blockquote>
    ),

    // Code blocks — dark ink panels on the paper canvas
    code: ({ className, children }) => {
      const isInline = !className
      if (isInline) {
        return (
          <code className="bg-muted px-1.5 py-0.5 rounded-md text-[0.85em] font-mono border border-border">
            {children}
          </code>
        )
      }
      return (
        <code className="block bg-ink text-ivory p-4 rounded-xl text-[13px] leading-relaxed font-mono overflow-x-auto my-3">
          {children}
        </code>
      )
    },

    // Horizontal rules
    hr: () => <hr className="my-4 border-border" />,

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border-collapse border border-border">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
    th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
}

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  isUser = false,
}: MarkdownMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="relative group">
      <div className={isUser ? "text-sm text-ivory" : "text-[15px] text-foreground"}>
        <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
          {content}
        </ReactMarkdown>
      </div>
      {!isUser && content && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background border border-border shadow-sm"
          onClick={handleCopy}
          title="Copy message"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  )
})
