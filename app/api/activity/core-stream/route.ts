import { NextResponse } from "next/server"
import { aggregateActivityCoreStream } from "@/lib/server/activity-core-stream-aggregator"
import { getEventInfrastructureBaseUrl } from "@/lib/server/event-infrastructure-url"
import type { ActivityCoreExperienceMode } from "@/lib/types/activity-core-stream"

export const runtime = "nodejs"

const normalizeBackend = (raw: string) =>
  raw.replace(/\/api\/?$/, "").replace(/\/$/, "")

const PRIMARY_BACKEND_URL = normalizeBackend(
  process.env.NEXT_PUBLIC_API_URL || "https://sparkd1-0.onrender.com"
)

const MODES: ActivityCoreExperienceMode[] = [
  "SOCIAL",
  "DATING",
  "BOTH",
  "MEETUP",
  "FAST_DATE",
]

export async function GET(request: Request) {
  const url = new URL(request.url)
  const city = url.searchParams.get("city")?.trim() || ""
  const lat = Number(url.searchParams.get("lat"))
  const lng = Number(url.searchParams.get("lng"))
  const lim = Number(url.searchParams.get("limit"))
  const modeRaw = (url.searchParams.get("mode") || "BOTH").toUpperCase()
  const mode: ActivityCoreExperienceMode = MODES.includes(modeRaw as ActivityCoreExperienceMode)
    ? (modeRaw as ActivityCoreExperienceMode)
    : "BOTH"

  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng)
  const authHeader = request.headers.get("authorization")

  try {
    const body = await aggregateActivityCoreStream({
      backendBaseUrl: PRIMARY_BACKEND_URL,
      catalogBaseUrl: getEventInfrastructureBaseUrl(),
      authHeader,
      city: city || undefined,
      lat: hasGeo ? lat : undefined,
      lng: hasGeo ? lng : undefined,
      limit: Number.isFinite(lim) ? lim : undefined,
      mode,
    })

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    })
  } catch (e) {
    console.error("[activity/core-stream]", e)
    const now = new Date().toISOString()
    return NextResponse.json(
      {
        events: [
          {
            id: "err-event",
            title: "Browse events",
            subtitle: "Something is always starting nearby",
            href: "/events",
            timestamp: now,
            source: "fallback",
            rank_score: 0.5,
            recency_score: 1,
            proximity_score: 0.5,
            activity_score_component: 0.5,
            engagement_probability: 0.5,
          },
        ],
        users: [
          {
            id: "err-user",
            headline: "Find people to meet",
            href: "/matches",
            timestamp: now,
            source: "fallback",
            rank_score: 0.45,
            recency_score: 1,
            proximity_score: 0.5,
            activity_score_component: 0.45,
            engagement_probability: 0.45,
          },
        ],
        groups: [
          {
            id: "err-group",
            name: "Join a group",
            subtitle: "Circles forming now",
            href: "/groups",
            timestamp: now,
            source: "fallback",
            rank_score: 0.45,
            recency_score: 1,
            proximity_score: 0.5,
            activity_score_component: 0.45,
            engagement_probability: 0.45,
          },
        ],
        fast_date: [
          {
            id: "err-fd",
            title: "Fast Date",
            subtitle: "Quick chemistry",
            href: "/events?explore=fastdate",
            timestamp: now,
            source: "fallback",
            rank_score: 0.45,
            recency_score: 1,
            proximity_score: 0.5,
            activity_score_component: 0.45,
            engagement_probability: 0.45,
          },
        ],
        trends: [
          {
            id: "err-trend",
            label: "Tonight",
            subtitle: "Live momentum",
            href: "/tonight",
            timestamp: now,
            source: "fallback",
            rank_score: 0.45,
            recency_score: 1,
            proximity_score: 0.5,
            activity_score_component: 0.45,
            engagement_probability: 0.45,
          },
        ],
        fallback_items: [
          {
            id: "err-fb",
            kind: "cta",
            title: "Explore Sparkd",
            subtitle: "We’ll refresh activity in a moment",
            href: "/feed",
            reason: "popular",
          },
        ],
        meta: {
          city_label: city || "Your area",
          activity_score: 40,
          partial: true,
          generated_at: now,
          mode_applied: mode,
          recommendation_boost: 3,
        },
      },
      { status: 200 }
    )
  }
}
