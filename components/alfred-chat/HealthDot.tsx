export function HealthDot() {
  return (
    <span
      className="flex items-center gap-2 rounded-full border border-ivory/10 px-3 py-1.5 text-[11px] tracking-wide text-ivory/60"
      title="Connected"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-glow-dot" />
      Connected
    </span>
  )
}
