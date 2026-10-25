import { cn } from "@/lib/utils"

type WordmarkProps = {
  className?: string
  inkClassName?: string
  accentClassName?: string
}

export function Wordmark({
  className,
  inkClassName = "text-[#171C14]",
  accentClassName = "text-[#B49B6C]",
}: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline whitespace-nowrap font-display leading-none",
        inkClassName,
        className,
      )}
    >
      <span className="font-semibold tracking-[0.02em]">ALFRED</span>
      <span className={cn("ml-[0.18em] italic font-normal", accentClassName)}>Ai</span>
      <span
        aria-hidden="true"
        className="relative -top-[1.75em] ml-[0.55em] text-[0.28em] font-normal leading-none opacity-80"
      >
        ™
      </span>
    </span>
  )
}
