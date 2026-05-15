"use client"

import { cn } from "@/lib/utils"

export function LivePulse({
  label,
  className,
  compact,
}: {
  label: string
  className?: string
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/10 px-2 py-0.5 font-semibold uppercase tracking-wider text-secondary",
        compact ? "text-[9px]" : "text-[10px]",
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_var(--secondary)]" />
      </span>
      {label}
    </span>
  )
}
