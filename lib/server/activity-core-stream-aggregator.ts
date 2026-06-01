import { aggregateLiveFeed } from "@/lib/server/live-feed-aggregator"
import { aggregateCityPulse } from "@/lib/server/city-pulse-aggregator"
import { sparkdEventToActivityCoreCatalog } from "@/lib/server/catalog-event-adapter"
import { backendJson } from "@/lib/server/backend-fetch"
import { fetchCatalogEvents } from "@/lib/server/fetch-catalog-events"
import { getEventInfrastructureBaseUrl } from "@/lib/server/event-infrastructure-url"
import { computeCoreStreamRank, modeBucketBoost } from "@/lib/activity-core-ranking"
import type { LiveFeedItem } from "@/lib/types/live-activity-feed"
import type {
  ActivityCoreExperienceMode,
  ActivityCoreFallbackItem,
  ActivityCoreStreamResponse,
  ActivityCoreEvent,
  ActivityCoreUser,
  ActivityCoreGroup,
  ActivityCoreFastDateSlot,
  ActivityCoreTrend,
} from "@/lib/types/activity-core-stream"

function firstStr(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return undefined
}

function firstNum(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.content)) return o.content as Record<string, unknown>[]
    if (Array.isArray(o.items)) return o.items as Record<string, unknown>[]
  }
  return []
}

const FD_RE = /\b(fast\s*date|date\s*card|cita\s+rápida|coffee\s*date|drinks)\b/i

function isFastDateItem(it: LiveFeedItem): boolean {
  if (FD_RE.test(`${it.headline} ${it.subtitle || ""}`)) return true
  if (it.source?.includes("fast")) return true
  return false
}

function isEventItem(it: LiveFeedItem): boolean {
  if (it.verb === "event_created" || it.verb === "event_join") return true
  if (it.target?.type === "event") return true
  return false
}

function isGroupItem(it: LiveFeedItem): boolean {
  if (it.verb === "group_created") return true
  if (it.target?.type === "group") return true
  return false
}

function isUserItem(it: LiveFeedItem): boolean {
  if (it.verb === "user_active" || it.verb === "match") return true
  if (it.target?.type === "user") return true
  return false
}

function isTrendItem(it: LiveFeedItem): boolean {
  return (
    it.verb === "trending_plan" ||
    it.verb === "planning_cluster" ||
    it.verb === "social_pulse"
  )
}

function timeBand(hour: number): { es: string; en: string; reason: ActivityCoreFallbackItem["reason"] } {
  if (hour >= 5 && hour < 11) {
    return { es: "Mañana", en: "Morning", reason: "time_of_day" }
  }
  if (hour >= 11 && hour < 15) {
    return { es: "Mediodía", en: "Midday", reason: "time_of_day" }
  }
  if (hour >= 15 && hour < 20) {
    return { es: "Tarde", en: "Afternoon", reason: "time_of_day" }
  }
  if (hour >= 20 || hour < 2) {
    return { es: "Noche", en: "Tonight", reason: "time_of_day" }
  }
  return { es: "Madrugada", en: "Late night", reason: "time_of_day" }
}

function buildFallbackCatalog(
  cityLabel: string,
  now: Date
): ActivityCoreFallbackItem[] {
  const hour = now.getHours()
  const band = timeBand(hour)
  const place = cityLabel.trim() || "near you"

  const catPick = ["GASTRONOMIA", "MUSICA", "DEPORTE", "SOCIAL"][(hour + now.getDate()) % 4]

  return [
    {
      id: "fb-cta-events",
      kind: "event",
      title: "Events starting soon",
      subtitle: `${band.en} · ${place} — browse live meetups`,
      href: "/events",
      reason: "popular",
    },
    {
      id: "fb-cta-tonight",
      kind: "trend",
      title: "Tonight mode",
      subtitle: "See what’s live right now around you",
      href: "/tonight",
      reason: "time_of_day",
    },
    {
      id: "fb-cta-fd",
      kind: "fast_date",
      title: "Fast Date openings",
      subtitle: "Quick chemistry — low pressure",
      href: "/events?explore=fastdate",
      reason: "popular",
    },
    {
      id: "fb-cta-groups",
      kind: "group",
      title: "Groups forming",
      subtitle: `Explore ${catPick.toLowerCase()} circles`,
      href: "/groups",
      reason: "category",
    },
    {
      id: "fb-cta-feed",
      kind: "cta",
      title: "City pulse",
      subtitle: "Posts and stories from your area",
      href: "/feed",
      reason: "location",
    },
    {
      id: "fb-cta-activity",
      kind: "trend",
      title: "Trending this hour",
      subtitle: `${band.es} / ${band.en} — momentum in ${place}`,
      href: "/activity-feed",
      reason: "time_of_day",
    },
  ]
}

function rankEvent(
  base: Pick<ActivityCoreEvent, "id" | "title" | "subtitle" | "href" | "time_window" | "timestamp" | "source">,
  engagement0to100: number,
  pulse: number,
  nowMs: number,
  mode: ActivityCoreExperienceMode,
  proximityKm?: number
): ActivityCoreEvent {
  const r = computeCoreStreamRank({
    timestampIso: base.timestamp,
    proximityKm,
    engagement0to100,
    pulseActivity0to100: pulse,
    nowMs,
    mode,
    bucketBoost: modeBucketBoost(mode, "events"),
  })
  return { ...base, ...r }
}

export async function aggregateActivityCoreStream(options: {
  backendBaseUrl: string
  /** Primary event catalog HTTP base (includes `/api` when required). */
  catalogBaseUrl?: string
  authHeader: string | null
  city?: string
  lat?: number
  lng?: number
  limit?: number
  mode?: ActivityCoreExperienceMode
}): Promise<ActivityCoreStreamResponse> {
  const mode: ActivityCoreExperienceMode = options.mode ?? "BOTH"
  const now = new Date()
  const nowMs = now.getTime()
  const hasGeo =
    options.lat != null &&
    options.lng != null &&
    Number.isFinite(options.lat) &&
    Number.isFinite(options.lng)

  const catalogBase = options.catalogBaseUrl ?? getEventInfrastructureBaseUrl()

  const [live, pulse, fdRes, catalogPack] = await Promise.all([
    aggregateLiveFeed({
      backendBaseUrl: options.backendBaseUrl,
      authHeader: options.authHeader,
      lat: hasGeo ? options.lat : undefined,
      lng: hasGeo ? options.lng : undefined,
      limit: Math.min(56, Math.max(20, options.limit ?? 40)),
    }),
    aggregateCityPulse({
      backendBaseUrl: options.backendBaseUrl,
      authHeader: options.authHeader,
      city: options.city?.trim() || undefined,
      lat: hasGeo ? options.lat : undefined,
      lng: hasGeo ? options.lng : undefined,
    }),
    backendJson(options.backendBaseUrl, `/api/date-cards/feed`, options.authHeader),
    fetchCatalogEvents({
      catalogBaseUrl: catalogBase,
      authHeader: options.authHeader,
      lat: hasGeo ? options.lat : undefined,
      lng: hasGeo ? options.lng : undefined,
      maxRows: 40,
    }),
  ])

  const pulseActivity = pulse.activity_score
  const partial = Boolean(live.meta.partial || pulse.partial || !catalogPack.ok)
  const cityLabel = pulse.city_label || (hasGeo ? "Your area" : options.city?.trim() || "Your city")

  const events: ActivityCoreEvent[] = []
  const users: ActivityCoreUser[] = []
  const groups: ActivityCoreGroup[] = []
  const fast_date: ActivityCoreFastDateSlot[] = []
  const trends: ActivityCoreTrend[] = []

  const catalogIds = new Set(catalogPack.events.map((e) => e.id))
  for (const ev of catalogPack.events) {
    events.push(
      sparkdEventToActivityCoreCatalog(
        ev,
        pulseActivity,
        nowMs,
        mode,
        hasGeo ? options.lat : undefined,
        hasGeo ? options.lng : undefined
      )
    )
  }

  for (const ev of pulse.trending_events || []) {
    if (!ev.title) continue
    const eid = ev.event_id || `pulse-${ev.title.slice(0, 24)}`
    if (catalogIds.has(String(eid))) continue
    events.push(
      rankEvent(
        {
          id: String(eid),
          title: ev.title,
          subtitle: ev.zone_label,
          href: ev.event_id ? `/events/${encodeURIComponent(ev.event_id)}` : "/events",
          time_window: ev.zone_label,
          timestamp: pulse.generated_at,
          source: "pulse",
        },
        ev.engagement_hint ?? 48,
        pulseActivity,
        nowMs,
        mode
      )
    )
  }

  for (const it of live.items) {
    const eng = it.engagementScore
    if (isEventItem(it) && !isFastDateItem(it)) {
      const tid = it.target?.id || it.id
      if (catalogIds.has(String(tid))) continue
      events.push(
        rankEvent(
          {
            id: String(tid),
            title: it.target?.title || it.headline,
            subtitle: it.subtitle,
            href: it.href || "/events",
            time_window: it.subtitle,
            timestamp: it.timestamp,
            source: "live",
          },
          eng,
          pulseActivity,
          nowMs,
          mode,
          it.proximityKm
        )
      )
    } else if (isUserItem(it)) {
      const uid = it.actors?.[0]?.userId || it.target?.id || it.id
      const base = {
        id: String(uid),
        headline: it.headline,
        username: it.actors?.[0]?.username,
        href: it.href || "/matches",
        avatar_url: it.actors?.[0]?.avatarUrl,
        timestamp: it.timestamp,
        source: "live" as const,
      }
      const r = computeCoreStreamRank({
        timestampIso: it.timestamp,
        proximityKm: it.proximityKm,
        engagement0to100: eng,
        pulseActivity0to100: pulseActivity,
        nowMs,
        mode,
        bucketBoost: modeBucketBoost(mode, "users"),
      })
      users.push({ ...base, ...r })
    } else if (isGroupItem(it)) {
      const gid = it.target?.id || it.id.replace(/^grp-/, "")
      const base = {
        id: String(gid),
        name: it.target?.title || it.headline,
        subtitle: it.subtitle,
        href: it.href || `/groups/${gid}`,
        timestamp: it.timestamp,
        source: "live" as const,
      }
      const r = computeCoreStreamRank({
        timestampIso: it.timestamp,
        proximityKm: it.proximityKm,
        engagement0to100: eng,
        pulseActivity0to100: pulseActivity,
        nowMs,
        mode,
        bucketBoost: modeBucketBoost(mode, "groups"),
      })
      groups.push({ ...base, ...r })
    } else if (isFastDateItem(it)) {
      const base = {
        id: it.id,
        title: it.headline,
        subtitle: it.subtitle,
        href: it.href || "/events?explore=fastdate",
        timestamp: it.timestamp,
        source: "live" as const,
      }
      const r = computeCoreStreamRank({
        timestampIso: it.timestamp,
        proximityKm: it.proximityKm,
        engagement0to100: eng,
        pulseActivity0to100: pulseActivity,
        nowMs,
        mode,
        bucketBoost: modeBucketBoost(mode, "fast_date"),
      })
      fast_date.push({ ...base, ...r })
    } else if (isTrendItem(it)) {
      const base = {
        id: it.id,
        label: it.headline,
        subtitle: it.subtitle,
        href: it.href || "/tonight",
        timestamp: it.timestamp,
        source: "live" as const,
      }
      const r = computeCoreStreamRank({
        timestampIso: it.timestamp,
        proximityKm: it.proximityKm,
        engagement0to100: eng,
        pulseActivity0to100: pulseActivity,
        nowMs,
        mode,
        bucketBoost: modeBucketBoost(mode, "trends"),
      })
      trends.push({ ...base, ...r })
    }
  }

  if (fdRes.ok && fdRes.data) {
    const rows = unwrapList(fdRes.data)
    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      const raw = rows[i]
      const id =
        firstStr(raw.id, raw.dateCardId, typeof raw._id === "string" ? raw._id : undefined) || `fd-${i}`
      const title = firstStr(raw.title, raw.headline, raw.planTitle) || "Fast Date"
      const subtitle = firstStr(raw.locationZone, raw.zone, raw.city)
      const base = {
        id: String(id),
        title,
        subtitle,
        href: `/events?explore=fastdate`,
        timestamp: firstStr(raw.dateTime, raw.startsAt, raw.createdAt) || pulse.generated_at,
        source: "backend_fd" as const,
      }
      const r = computeCoreStreamRank({
        timestampIso: base.timestamp,
        proximityKm: firstNum(raw.distanceKm, raw.distance_km),
        engagement0to100: firstNum(raw.compatibilityScore, raw.score) ?? 55,
        pulseActivity0to100: pulseActivity,
        nowMs,
        mode,
        bucketBoost: modeBucketBoost(mode, "fast_date"),
      })
      fast_date.push({ ...base, ...r })
    }
  }

  const dedup = <T extends { id: string }>(arr: T[]): T[] => {
    const seen = new Set<string>()
    const out: T[] = []
    for (const x of arr) {
      const k = `${x.id}`
      if (seen.has(k)) continue
      seen.add(k)
      out.push(x)
    }
    return out
  }

  let eventsD = dedup(events).sort((a, b) => b.rank_score - a.rank_score)
  let usersD = dedup(users).sort((a, b) => b.rank_score - a.rank_score)
  let groupsD = dedup(groups).sort((a, b) => b.rank_score - a.rank_score)
  let fdD = dedup(fast_date).sort((a, b) => b.rank_score - a.rank_score)
  let trendsD = dedup(trends).sort((a, b) => b.rank_score - a.rank_score)

  const fallback_items = buildFallbackCatalog(cityLabel, now)

  const synthRank = (seed: number) =>
    computeCoreStreamRank({
      timestampIso: now.toISOString(),
      engagement0to100: 40 + (seed % 30),
      pulseActivity0to100: Math.max(pulseActivity, 35),
      nowMs,
      mode,
    })

  if (eventsD.length === 0) {
    const fb = fallback_items.find((f) => f.kind === "event")!
    const r = synthRank(1)
    eventsD = [
      {
        id: "fallback-event",
        title: fb.title,
        subtitle: fb.subtitle,
        href: fb.href,
        timestamp: now.toISOString(),
        source: "fallback",
        ...r,
      },
    ]
  }
  if (usersD.length === 0) {
    const r = synthRank(2)
    usersD = [
      {
        id: "fallback-users",
        headline: "People are sparking nearby",
        username: "sparkd",
        href: "/matches",
        timestamp: now.toISOString(),
        source: "fallback",
        ...r,
      },
    ]
  }
  if (groupsD.length === 0) {
    const fb = fallback_items.find((f) => f.kind === "group")!
    const r = synthRank(3)
    groupsD = [
      {
        id: "fallback-group",
        name: fb.title,
        subtitle: fb.subtitle,
        href: fb.href,
        timestamp: now.toISOString(),
        source: "fallback",
        ...r,
      },
    ]
  }
  if (fdD.length === 0) {
    const fb = fallback_items.find((f) => f.kind === "fast_date")!
    const r = synthRank(4)
    fdD = [
      {
        id: "fallback-fd",
        title: fb.title,
        subtitle: fb.subtitle,
        href: fb.href,
        timestamp: now.toISOString(),
        source: "fallback",
        ...r,
      },
    ]
  }
  if (trendsD.length === 0) {
    const fb = fallback_items.find((f) => f.kind === "trend")!
    const r = synthRank(5)
    trendsD = [
      {
        id: "fallback-trend",
        label: fb.title,
        subtitle: fb.subtitle,
        href: fb.href,
        timestamp: now.toISOString(),
        source: "fallback",
        ...r,
      },
    ]
  }

  const cap = 14
  return {
    events: eventsD.slice(0, cap),
    users: usersD.slice(0, cap),
    groups: groupsD.slice(0, cap),
    fast_date: fdD.slice(0, cap),
    trends: trendsD.slice(0, cap),
    fallback_items,
    meta: {
      city_label: cityLabel,
      activity_score: pulseActivity,
      partial,
      generated_at: new Date().toISOString(),
      mode_applied: mode,
      recommendation_boost: pulse.recommendation_boost ?? 0,
    },
  }
}
