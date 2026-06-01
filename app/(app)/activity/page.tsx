"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  Compass,
  Heart,
  Lightbulb,
  Loader2,
  MapPin,
  Radio,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useExperienceMode } from "@/hooks/use-experience-mode"
import { useFeed } from "@/hooks/use-feed"
import { useCityPulse } from "@/hooks/use-city-pulse"
import { useI18n } from "@/lib/i18n"
import { recommendationGraphV2Service } from "@/lib/services/recommendation-graph-v2"
import { conversionLoopService } from "@/lib/services/conversion-loop"
import { FeedEngagementSummary } from "@/components/feed/feed-engagement-summary"
import { CityPulseIndicator } from "@/components/city/city-pulse-indicator"
import { NearbyActivityLayer } from "@/components/activity/nearby-activity-layer"
import { SparkdMomentsRail } from "@/components/moments/sparkd-moments-rail"
import { RecommendationGraphPeek } from "@/components/recommendations/recommendation-graph-peek"
import { ConversionLoopCoach } from "@/components/conversion/conversion-loop-coach"
import { FeedLiveStrip } from "@/components/activity/feed-live-strip"
import { cn } from "@/lib/utils"

function Section({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/70 bg-card/70 p-3 shadow-sm sm:p-4",
        className
      )}
    >
      <header className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
        </span>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export default function DiscoverActivityPage() {
  const { t, te } = useI18n()
  const { user } = useAuth()
  const experienceMode = useExperienceMode()
  const { posts, loading: postsLoading } = useFeed()

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("sparkd_location") : null
      if (!raw) return
      const j = JSON.parse(raw) as { latitude?: number; longitude?: number }
      if (typeof j.latitude === "number" && typeof j.longitude === "number") {
        setCoords({ lat: j.latitude, lng: j.longitude })
      }
    } catch {
      /* ignore */
    }
  }, [user?.userId])

  const showSocial = experienceMode === "SOCIAL" || experienceMode === "BOTH"

  const { pulse: cityPulse, loading: cityPulseLoading } = useCityPulse({
    lat: coords?.lat,
    lng: coords?.lng,
    enabled: Boolean(coords) && showSocial,
  })

  useEffect(() => {
    if (!user?.userId) return
    if (typeof sessionStorage === "undefined") return
    if (sessionStorage.getItem("sparkd_graph_v2_loc")) return
    if (!coords) return
    void recommendationGraphV2Service
      .postGraphUpdate({ viewer_signals: { latitude: coords.lat, longitude: coords.lng } })
      .then(() => sessionStorage.setItem("sparkd_graph_v2_loc", "1"))
      .catch(() => {})
  }, [user?.userId, coords?.lat, coords?.lng])

  useEffect(() => {
    if (!user?.userId) return
    conversionLoopService.track({ stage: "session" }).catch(() => {})
  }, [user?.userId])

  const hasAnyContent = useMemo(
    () =>
      Boolean(coords) ||
      (Array.isArray(posts) && posts.length > 0) ||
      experienceMode !== "DATING",
    [coords, posts, experienceMode]
  )

  return (
    <div className="mx-auto max-w-3xl pb-24 lg:pb-10">
      <header className="border-b border-border/60 bg-muted/20 px-4 pb-5 pt-5 md:px-6 md:pb-6">
        <div className="mx-auto flex max-w-2xl items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/25">
            <Compass className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.65rem]">
              {t("discover.pageTitle")}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t("discover.pageSubtitle")}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-5 md:px-6">
        {postsLoading && posts.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>{te("Cargando…", "Loading…")}</span>
          </div>
        ) : null}

        {experienceMode !== "DATING" ? (
          <Section icon={Radio} title={t("discover.section.live")}>
            <FeedLiveStrip te={te} lat={coords?.lat} lng={coords?.lng} className="mt-0" />
          </Section>
        ) : null}

        {showSocial && coords ? (
          <Section icon={MapPin} title={t("discover.section.cityPulse")}>
            <CityPulseIndicator
              pulse={cityPulse}
              loading={cityPulseLoading}
              te={te}
              className="mt-0"
            />
          </Section>
        ) : null}

        {showSocial ? (
          <Section icon={Sparkles} title={t("discover.section.nearby")}>
            <NearbyActivityLayer context="feed" className="mx-0" />
          </Section>
        ) : null}

        {showSocial ? (
          <Section icon={Heart} title={t("discover.section.moments")}>
            <SparkdMomentsRail te={te} className="mx-0" />
          </Section>
        ) : null}

        {showSocial && user?.userId ? (
          <Section icon={Compass} title={t("discover.section.recommendations")}>
            <RecommendationGraphPeek userId={user.userId} te={te} className="mx-0" />
          </Section>
        ) : null}

        {showSocial && user?.userId ? (
          <Section icon={Lightbulb} title={t("discover.section.tips")}>
            <ConversionLoopCoach userId={user.userId} te={te} className="mx-0" />
          </Section>
        ) : null}

        {user?.userId ? (
          <Section icon={BarChart3} title={t("discover.section.engagement")}>
            <FeedEngagementSummary
              className="mx-0 mt-0 mb-0"
              fallback={
                posts.length > 0
                  ? {
                      totalLikes: posts.reduce((s, p) => s + (p.likeCount || 0), 0),
                      totalComments: posts.reduce((s, p) => s + (p.commentsCount || 0), 0),
                      totalReposts: posts.reduce((s, p) => s + (p.repostCount || 0), 0),
                      avgEngagement: Math.round(
                        posts.reduce(
                          (s, p) => s + (p.likeCount || 0) + (p.commentsCount || 0) + (p.repostCount || 0),
                          0
                        ) / posts.length
                      ),
                    }
                  : undefined
              }
            />
          </Section>
        ) : null}

        {!hasAnyContent ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/15 p-6 text-center">
            <p className="text-base font-semibold text-foreground">{t("discover.empty.title")}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("discover.empty.body")}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
