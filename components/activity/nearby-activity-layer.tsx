"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  CalendarPlus,
  Heart,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react"
import { useNearbyActivity } from "@/hooks/use-nearby-activity"
import { locationService } from "@/lib/services/location"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import type { NearbyActivityKind } from "@/lib/types/nearby-activity"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function KindIcon({ kind }: { kind: NearbyActivityKind }) {
  const cls = "size-3.5 shrink-0"
  switch (kind) {
    case "new_event":
      return <CalendarPlus className={cn(cls, "text-primary")} aria-hidden />
    case "live_user":
      return <UserRound className={cn(cls, "text-sky-500")} aria-hidden />
    case "forming_group":
      return <UsersRound className={cn(cls, "text-violet-500")} aria-hidden />
    case "trending_plan":
      return <TrendingUp className={cn(cls, "text-secondary")} aria-hidden />
    case "match_nearby":
      return <Heart className={cn(cls, "text-rose-500")} aria-hidden />
    default:
      return <Radio className={cls} aria-hidden />
  }
}

export function NearbyActivityLayer({
  context,
  className,
}: {
  context: "feed" | "events"
  className?: string
}) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const loc = await locationService.getCurrentLocation()
        if (!cancelled && loc?.latitude != null && loc?.longitude != null) {
          setCoords({ lat: loc.latitude, lng: loc.longitude })
          return
        }
      } catch {
        /* fall through */
      }
      const raw =
        typeof window !== "undefined" ? window.localStorage.getItem("sparkd_location") : null
      if (!cancelled && raw) {
        try {
          const j = JSON.parse(raw) as { latitude?: number; longitude?: number }
          if (j.latitude != null && j.longitude != null) {
            setCoords({ lat: j.latitude, lng: j.longitude })
          }
        } catch {
          /* ignore */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.userId])

  const { pulses, loading, refresh } = useNearbyActivity({
    lat: coords?.lat,
    lng: coords?.lng,
    pollMs: 55_000,
    t,
  })

  return (
    <section
      aria-label={t("nearbyActivity.aria")}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-card/90 to-secondary/[0.05] shadow-sm ring-1 ring-primary/10",
        context === "feed" ? "mx-0 mb-3" : "mb-6",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background/90 to-transparent" aria-hidden />
      <div className="relative flex flex-col gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <Radio className="size-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-wider text-primary">
                {t("nearbyActivity.title")}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">{t("nearbyActivity.subtitle")}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-primary"
            disabled={loading}
            onClick={() => void refresh()}
            aria-label={t("nearbyActivity.refreshAria")}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin] snap-x snap-mandatory">
          {pulses.map((pulse) => (
            <Link
              key={`${pulse.kind}-${pulse.id}`}
              href={pulse.href}
              className={cn(
                "flex min-w-[11.5rem] max-w-[13.5rem] snap-start flex-col gap-1 rounded-xl border px-3 py-2 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md active:translate-y-0",
                pulse.isPlaceholder
                  ? "border-dashed border-muted-foreground/25 bg-muted/30"
                  : "border-border/70 bg-background/80 backdrop-blur-sm"
              )}
            >
              <div className="flex items-center gap-2">
                <KindIcon kind={pulse.kind} />
                <span className="line-clamp-2 flex-1 text-left text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                  {pulse.title}
                </span>
              </div>
              {pulse.subtitle ? (
                <p className="line-clamp-2 text-left text-[10px] leading-snug text-muted-foreground">{pulse.subtitle}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-[9px] text-muted-foreground">
                {pulse.geoLabel ? (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="size-2.5 shrink-0" aria-hidden />
                    {pulse.geoLabel}
                  </span>
                ) : null}
                {pulse.engagementScore != null && pulse.engagementScore > 1 ? (
                  <span>{t("nearbyActivity.buzz")} {Math.round(pulse.engagementScore)}</span>
                ) : null}
                {pulse.isPlaceholder ? (
                  <span className="rounded bg-primary/10 px-1 py-px font-semibold text-primary">{t("nearbyActivity.sparkBadge")}</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
