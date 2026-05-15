import { api } from "@/lib/api"
import type { NearbyActivityPulse, NearbyActivityRaw } from "@/lib/types/nearby-activity"
import { liveFeedResponseToPulses } from "@/lib/services/live-activity-feed-mapper"
import { liveActivityFeedService } from "@/lib/services/live-activity-feed"

function unwrapList(raw: unknown): NearbyActivityRaw[] {
  if (Array.isArray(raw)) return raw as NearbyActivityRaw[]
  if (raw && typeof raw === "object" && Array.isArray((raw as { content?: unknown }).content)) {
    return (raw as { content: NearbyActivityRaw[] }).content
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as { pulses?: unknown }).pulses)) {
    return (raw as { pulses: NearbyActivityRaw[] }).pulses
  }
  return []
}

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

function ts(raw: NearbyActivityRaw): string | undefined {
  return firstStr(
    raw.activity_timestamp,
    raw.activityTimestamp,
    raw.createdAt,
    raw.created_at,
    raw.updatedAt,
    raw.updated_at
  )
}

function mapRow(raw: NearbyActivityRaw, kind: NearbyActivityPulse["kind"], idx: number): NearbyActivityPulse | null {
  const id = firstStr(raw.id, raw.eventId, raw.userId, raw.groupId, raw.planId) || `${kind}-${idx}`
  const title =
    firstStr(raw.title, raw.name, raw.username, raw.headline, raw.label, raw.snippet) ||
    firstStr(raw.eventTitle, raw.groupName) ||
    ""
  if (!title && kind !== "forming_group") return null

  const subtitle = firstStr(raw.subtitle, raw.zone, raw.city, raw.venueLabel, raw.activityHint, raw.description)
  const href =
    firstStr(raw.href, raw.link, raw.url) ||
    (firstStr(raw.eventId, raw.event_id) ? `/events/${firstStr(raw.eventId, raw.event_id)}` : undefined) ||
    (firstStr(raw.userId, raw.user_id) ? `/profile/${firstStr(raw.userId, raw.user_id)}` : undefined) ||
    (firstStr(raw.groupId, raw.group_id) ? `/groups/${firstStr(raw.groupId, raw.group_id)}` : undefined) ||
    "/feed"

  const geoLabel = firstStr(
    raw.geo_location,
    raw.geoLocation,
    raw.city,
    raw.zone,
    raw.neighborhood,
    raw.areaLabel
  )

  return {
    id: String(id),
    kind,
    title: title || (kind === "forming_group" ? "Group" : "Activity"),
    subtitle,
    href,
    activityTimestamp: ts(raw),
    engagementScore: firstNum(raw.engagement_score, raw.engagementScore, raw.score),
    visibilityRadiusKm: firstNum(raw.visibility_radius, raw.visibilityRadius, raw.radiusKm, raw.distanceKm),
    geoLabel,
  }
}

function normalizePulseList(rows: NearbyActivityRaw[], kind: NearbyActivityPulse["kind"]): NearbyActivityPulse[] {
  const out: NearbyActivityPulse[] = []
  rows.forEach((raw, i) => {
    const p = mapRow(raw, kind, i)
    if (p) out.push(p)
  })
  return out
}

async function safeGet(path: string): Promise<NearbyActivityRaw[]> {
  try {
    const data = await api.get<unknown>(path)
    return unwrapList(data)
  } catch {
    return []
  }
}

export async function fetchNearbyActivityBundle(lat?: number, lng?: number): Promise<NearbyActivityPulse[]> {
  try {
    const unified = await liveActivityFeedService.get({
      lat,
      lng,
      limit: 28,
    })
    const fromUnified = liveFeedResponseToPulses(unified)
    if (fromUnified.length > 0) return fromUnified
  } catch {
    /* fallback to legacy fan-out */
  }

  const q =
    lat != null && lng != null
      ? `?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`
      : ""

  const [nearbyRows, trendingRows, liveRows, plansRows] = await Promise.all([
    safeGet(`/api/activity/nearby${q}`),
    safeGet(`/api/activity/trending${q}`),
    safeGet(`/api/activity/live-users${q}`),
    safeGet(`/api/activity/new-plans${q}`),
  ])

  const merged: NearbyActivityPulse[] = [
    ...normalizePulseList(nearbyRows, "new_event"),
    ...normalizePulseList(trendingRows, "trending_plan"),
    ...normalizePulseList(liveRows, "live_user"),
    ...normalizePulseList(plansRows, "forming_group"),
  ]

  merged.sort((a, b) => {
    const ea = a.engagementScore ?? 0
    const eb = b.engagementScore ?? 0
    if (eb !== ea) return eb - ea
    const ta = a.activityTimestamp ? new Date(a.activityTimestamp).getTime() : 0
    const tb = b.activityTimestamp ? new Date(b.activityTimestamp).getTime() : 0
    return tb - ta
  })

  const seen = new Set<string>()
  return merged.filter((p) => {
    const k = `${p.kind}:${p.id}:${p.title}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
