"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Camera, Loader2, RefreshCw, Share2, Sparkles, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { momentsService } from "@/lib/services/moments"
import type { SparkdMoment } from "@/lib/types/moments"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function shareMoment(m: SparkdMoment, headline: string) {
  const path = m.share_path || `/feed?moment=${encodeURIComponent(m.id)}`
  const url =
    typeof window !== "undefined" ? `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}` : path
  const text = headline
  if (typeof navigator !== "undefined" && navigator.share) {
    void navigator.share({ title: "Sparkd", text, url }).catch(() => {})
    return
  }
  void navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {})
}

export function SparkdMomentsRail({
  te,
  className,
}: {
  te: (es: string, en: string) => string
  className?: string
}) {
  const { user } = useAuth()
  const [mine, setMine] = useState<SparkdMoment[]>([])
  const [trending, setTrending] = useState<SparkdMoment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user?.userId) {
      setMine([])
      setTrending([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [feedRes, trendRes] = await Promise.all([
        momentsService.getFeed(user.userId).catch(() => ({ moments: [], connection_score: 0 })),
        momentsService.getTrending(12).catch(() => ({ moments: [], generated_at: "" })),
      ])
      setMine(Array.isArray(feedRes.moments) ? feedRes.moments.slice(0, 8) : [])
      setTrending(Array.isArray(trendRes.moments) ? trendRes.moments : [])
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = window.setInterval(() => void load(), 90_000)
    return () => window.clearInterval(id)
  }, [load])

  if (!user?.userId) return null

  const rail = [...mine, ...trending.filter((t) => !mine.some((m) => m.id === t.id))].slice(0, 14)

  return (
    <section
      aria-label={te("Momentos Sparkd", "Sparkd Moments")}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/[0.07] via-card/95 to-primary/[0.06] shadow-sm ring-1 ring-violet-500/10",
        className
      )}
    >
      <div className="relative flex flex-col gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-violet-500" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                {te("Momentos", "Moments")}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {te("Tu vida social en tiempo real", "Real life, recorded in real time")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-violet-600"
            disabled={loading}
            onClick={() => void load()}
            aria-label={te("Actualizar momentos", "Refresh moments")}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin] snap-x snap-mandatory">
          {loading && rail.length === 0 ? (
            <div className="flex h-24 min-w-[8rem] items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 px-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : null}
          {rail.map((m) => {
            const href = m.share_path || `/feed?moment=${encodeURIComponent(m.id)}`
            const isTrend = trending.some((t) => t.id === m.id) && !mine.some((x) => x.id === m.id)
            return (
              <div
                key={m.id}
                className="flex min-w-[11.5rem] max-w-[14rem] snap-start flex-col gap-1 rounded-xl border border-border/60 bg-background/85 px-3 py-2 shadow-sm backdrop-blur-sm dark:bg-background/70"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {isTrend ? (
                      <TrendingUp className="size-3 shrink-0 text-amber-500" aria-hidden />
                    ) : (
                      <Camera className="size-3 shrink-0 text-violet-500" aria-hidden />
                    )}
                    <span className="line-clamp-2 text-left text-[11px] font-semibold leading-tight text-foreground">
                      {m.headline}
                    </span>
                  </div>
                </div>
                <p className="line-clamp-1 text-[9px] text-muted-foreground">
                  {new Date(m.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="mt-auto flex flex-wrap gap-1">
                  <Button variant="secondary" size="sm" className="h-7 flex-1 rounded-lg px-2 text-[10px]" asChild>
                    <Link href={href.startsWith("/") ? href : `/${href}`}>{te("Ver", "View")}</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 rounded-lg px-2"
                    aria-label={te("Compartir", "Share")}
                    onClick={() => shareMoment(m, m.headline)}
                  >
                    <Share2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            )
          })}
          {!loading && rail.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              {te(
                "Tus momentos aparecerán al unirte a meetups, matches y planes.",
                "Moments appear when you join meetups, match on Fast Date, and join plans."
              )}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
