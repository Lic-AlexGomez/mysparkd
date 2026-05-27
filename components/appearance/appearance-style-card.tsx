"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppearanceStyleOption({
  title,
  description,
  colors,
  selected,
  onSelect,
}: {
  title: string
  description: string
  colors?: [string, string, string]
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition-colors",
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border/50 bg-card/30 hover:border-border"
      )}
    >
      {colors ? (
        <div
          className="h-1 w-full shrink-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
          }}
        />
      ) : null}
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 bg-transparent"
        )}
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold leading-tight text-foreground">{title}</p>
        <p className="line-clamp-3 text-[10px] leading-snug text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}
