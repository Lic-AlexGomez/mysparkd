"use client"

import Link from "next/link"
import { CalendarClock, Loader2, ChevronRight, Zap } from "lucide-react"
import { useFeedLive } from "@/hooks/use-feed-live"
import { cn } from "@/lib/utils"

export function FeedLiveStrip({
  te,
  className,
  lat,
  lng,
}: {
  te: (es: string, en: string) => string
  className?: string
  lat?: number
  lng?: number
}) {
  const { data, loading } = useFeedLive({
    lat,
    lng,
    limit: 24,
    enabled: true,
    refreshMs: 90_000,
  })

  const events = data?.events ?? []
  const activity = data?.activity ?? []

  return (
    <section
      aria-label={te("Eventos y actividad en vivo", "Live events and activity")}
      className={cn(
        "rounded-2xl border border-border/80 bg-card/80 p-3 shadow-sm ring-1 ring-border/40 sm:p-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 text-xs font-bold uppercase tracking-wide text-primary">
          {te("Eventos ahora cerca de ti", "Events happening near you now")}
        </p>
        {loading ? <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden /> : null}
      </div>
      {data?.meta.partial ? (
        <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
          {te("Señal parcial — reintentando en unos segundos", "Partial signal — retrying shortly")}
        </p>
      ) : null}

      {events.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {events.slice(0, 5).map((ev) => (
            <li key={ev.id}>
              <Link
                href={ev.href}
                className="flex items-center justify-between gap-2 rounded-lg bg-background/70 px-2 py-1.5 text-[11px] font-medium ring-1 ring-border/50 hover:bg-background dark:bg-background/45"
              >
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-foreground">{ev.title}</span>
                  {ev.zone_label ? (
                    <span className="mt-0.5 block line-clamp-1 text-[10px] text-muted-foreground">{ev.zone_label}</span>
                  ) : null}
                </span>
                <ChevronRight className="size-3 shrink-0 opacity-50" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : !loading ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {te("Sin eventos en catálogo para tu zona ahora. Explora todos.", "No catalog events for your area right now. Browse all.")}{" "}
          <Link href="/events" className="font-medium text-primary underline-offset-2 hover:underline">
            {te("Ver eventos", "See events")}
          </Link>
        </p>
      ) : null}

      {activity.length > 0 ? (
        <div className="mt-3 border-t border-border/60 pt-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Zap className="size-3" aria-hidden />
            {te("Pulso", "Pulse")}
          </div>
          <ul className="space-y-1">
            {activity.slice(0, 4).map((it) => (
              <li key={it.id}>
                <Link
                  href={it.href || "/feed"}
                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <span className="line-clamp-2">{it.headline}</span>
                  <ChevronRight className="size-3 shrink-0 opacity-40" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
