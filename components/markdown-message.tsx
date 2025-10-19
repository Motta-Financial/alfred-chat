"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy:", err)
    }
  }

  const components: Components = {
    // Headers with proper hierarchy and styling
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground border-b border-border pb-2">{children}</h1>
    ),
    h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5 text-foreground">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-3 text-foreground">{children}</h4>,

    // Paragraphs with proper spacing
    p: ({ children, node }) => {
      // Check if this paragraph is inside a list item
      const isInListItem = node?.position?.start.line === node?.position?.end.line
      return <p className={`leading-relaxed ${isInListItem ? "inline" : "mb-3 last:mb-0"}`}>{children}</p>
    },

    // Strong/bold text
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,

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

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-3 italic text-muted-foreground bg-muted/30 rounded-r">
        {children}
      </blockquote>
    ),

    // Code blocks
    code: ({ className, children }) => {
      const isInline = !className
      if (isInline) {
        return (
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground border border-border">
            {children}
          </code>
        )
      }
      return (
        <code className="block bg-muted p-3 rounded text-sm font-mono overflow-x-auto my-3 border border-border">
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

  return (
    <div className="relative group">
      <div className={`text-sm ${isUser ? "text-primary-foreground" : "text-foreground"}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
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
}
