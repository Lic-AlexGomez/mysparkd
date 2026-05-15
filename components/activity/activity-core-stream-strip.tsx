"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Radio, Loader2, ChevronRight } from "lucide-react"
import { useActivityCoreStream } from "@/hooks/use-activity-core-stream"
import type { ActivityCoreExperienceMode } from "@/lib/types/activity-core-stream"
import { cn } from "@/lib/utils"

export type ActivityCoreStreamContext = "feed" | "events" | "groups" | "tonight" | "generic"

function mapContextToMode(
  context: ActivityCoreStreamContext,
  override?: ActivityCoreExperienceMode
): ActivityCoreExperienceMode | undefined {
  if (override) return override
  if (context === "groups") return "SOCIAL"
  return "BOTH"
}

export function ActivityCoreStreamStrip({
  te,
  className,
  lat,
  lng,
  city,
  mode,
  context = "generic",
}: {
  te: (es: string, en: string) => string
  className?: string
  lat?: number
  lng?: number
  city?: string
  mode?: ActivityCoreExperienceMode
  context?: ActivityCoreStreamContext
}) {
  const [lsGeo, setLsGeo] = useState<{ lat: number; lng: number } | null>(null)
  useEffect(() => {
    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) return
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("sparkd_location") : null
      if (!raw) return
      const j = JSON.parse(raw) as { latitude?: number; longitude?: number }
      if (typeof j.latitude === "number" && typeof j.longitude === "number") {
        setLsGeo({ lat: j.latitude, lng: j.longitude })
      }
    } catch {
      /* ignore */
    }
  }, [lat, lng])

  const effLat = lat ?? lsGeo?.lat
  const effLng = lng ?? lsGeo?.lng

  const effectiveMode = mapContextToMode(context, mode)
  const { data, loading } = useActivityCoreStream({
    lat: effLat,
    lng: effLng,
    city,
    mode: effectiveMode,
    limit: 36,
    enabled: true,
    refreshMs: 90_000,
  })

  const picks: { title: string; href: string; sub?: string }[] = []
  if (data) {
    for (const e of data.events.slice(0, 2)) {
      picks.push({ title: e.title, href: e.href, sub: e.subtitle })
    }
    for (const u of data.users.slice(0, 1)) {
      picks.push({ title: u.headline, href: u.href, sub: u.username })
    }
    for (const g of data.groups.slice(0, 1)) {
      picks.push({ title: g.name, href: g.href, sub: g.subtitle })
    }
    for (const f of data.fast_date.slice(0, 1)) {
      picks.push({ title: f.title, href: f.href, sub: f.subtitle })
    }
    for (const t of data.trends.slice(0, 1)) {
      picks.push({ title: t.label, href: t.href, sub: t.subtitle })
    }
    for (const fb of data.fallback_items.slice(0, 2)) {
      if (picks.length >= 6) break
      picks.push({ title: fb.title, href: fb.href, sub: fb.subtitle })
    }
  }

  return (
    <section
      aria-label={te("Actividad cerca de ti", "Activity near you")}
      className={cn(
        "rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-secondary/[0.06] p-3 shadow-sm ring-1 ring-primary/10 sm:p-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Radio className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 text-xs font-bold uppercase tracking-wide text-primary">
          {te("Algo está pasando ahora cerca de ti", "Something is happening near you right now")}
        </p>
        {loading ? <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden /> : null}
      </div>
      {data?.meta.partial ? (
        <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
          {te("Señal parcial — mostrando impulso de la ciudad", "Partial signal — showing city momentum")}
        </p>
      ) : null}
      <ul className="mt-2 space-y-1.5">
        {(picks.length ? picks : [{ title: "…", href: "/events", sub: "" }]).map((p, i) => (
          <li key={`${p.href}-${i}`}>
            <Link
              href={p.href}
              className="flex items-center justify-between gap-2 rounded-lg bg-background/70 px-2 py-1.5 text-[11px] font-medium ring-1 ring-border/50 hover:bg-background dark:bg-background/45"
            >
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-foreground">{p.title}</span>
                {p.sub ? (
                  <span className="mt-0.5 block line-clamp-1 text-[10px] text-muted-foreground">{p.sub}</span>
                ) : null}
              </span>
              <ChevronRight className="size-3 shrink-0 opacity-50" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      {data ? (
        <p className="mt-2 text-[10px] text-muted-foreground">
          {data.meta.city_label} · {te("pulso", "pulse")} {Math.round(data.meta.activity_score)}
        </p>
      ) : null}
    </section>
  )
}
