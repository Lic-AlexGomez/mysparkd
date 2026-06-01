"use client"

import { MapPin, Radio, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CityPulseResponse } from "@/lib/types/city-pulse"

export function CityPulseIndicator({
  pulse,
  loading,
  te,
  className,
}: {
  pulse: CityPulseResponse | null
  loading?: boolean
  te: (es: string, en: string) => string
  className?: string
}) {
  const score = pulse?.activity_score ?? 0
  const alive = score >= 42
  const label = pulse?.city_label || te("Tu ciudad", "Your city")

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 text-xs shadow-sm ring-1 transition-colors",
        alive
          ? "border-emerald-500/35 bg-emerald-500/[0.07] ring-emerald-500/15 dark:bg-emerald-500/[0.09]"
          : "border-border/60 bg-muted/30 ring-black/[0.03] dark:ring-white/[0.06]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-40",
            alive ? "animate-ping bg-emerald-500" : "bg-muted-foreground/40"
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            alive ? "bg-emerald-500" : "bg-muted-foreground/50"
          )}
        />
      </span>
      <Radio className={cn("size-3.5 shrink-0", alive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <MapPin className="size-3 shrink-0 text-primary" aria-hidden />
          <span className="truncate">{label}</span>
        </span>
        <span className="text-muted-foreground">
          {loading
            ? te("Midiendo pulso…", "Measuring pulse…")
            : alive
              ? te("Tu ciudad está viva ahora", "Your city is alive right now")
              : te("Actividad moderada", "Moderate activity")}
        </span>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-foreground ring-1 ring-border/60 dark:bg-background/50">
        <Zap className="size-3 text-amber-500" aria-hidden />
        {loading ? "—" : `${score}`}
      </span>
    </div>
  )
}
