import { cn } from "@/lib/utils"

type WordmarkProps = {
  className?: string
  inkClassName?: string
}

export function Wordmark({ className, inkClassName = "text-[#171C14]" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline whitespace-nowrap font-display leading-none",
        inkClassName,
        className,
      )}
    >
      <span className="font-semibold tracking-[0.02em]">ALFRED</span>
      <span className="ml-[0.18em] italic font-normal text-[#B49B6C]">Ai</span>
      <sup className="ml-[0.08em] self-start text-[0.28em] font-normal leading-none opacity-80">
        ™
      </sup>
    </span>
  )
}
