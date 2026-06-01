import type {
  CityPulseHotZone,
  CityPulseMetrics,
  CityPulseResponse,
  CityPulseTrendingEvent,
} from "@/lib/types/city-pulse"
import { computeActivityScore, pulseRecommendationBoost } from "@/lib/city-pulse-scoring"

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.content)) return o.content as Record<string, unknown>[]
    if (Array.isArray(o.pulses)) return o.pulses as Record<string, unknown>[]
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

function normCity(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function rowGeoText(raw: Record<string, unknown>): string {
  return [
    firstStr(raw.zone, raw.city, raw.geo_location, raw.geoLocation, raw.neighborhood, raw.areaLabel),
    firstStr(raw.subtitle, raw.title, raw.headline, raw.eventTitle, raw.name, raw.label, raw.snippet),
    firstStr(raw.venueLabel, raw.locationZone, raw.activityHint),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** City text match OR within radiusKm of viewer when coords exist on row + viewer. */
function rowMatchesCityScope(
  raw: Record<string, unknown>,
  cityNorm: string,
  viewerLat?: number,
  viewerLng?: number,
  radiusKm = 55
): boolean {
  if (!cityNorm) {
    if (
      viewerLat != null &&
      viewerLng != null &&
      Number.isFinite(viewerLat) &&
      Number.isFinite(viewerLng)
    ) {
      const lat = firstNum(raw.latitude, raw.lat)
      const lng = firstNum(raw.longitude, raw.lng, raw.lon)
      if (lat != null && lng != null) {
        return distanceKm(viewerLat, viewerLng, lat, lng) <= radiusKm
      }
      return true
    }
    return true
  }

  const hay = rowGeoText(raw)
  if (!hay.trim()) {
    if (
      viewerLat != null &&
      viewerLng != null &&
      Number.isFinite(viewerLat) &&
      Number.isFinite(viewerLng)
    ) {
      const lat = firstNum(raw.latitude, raw.lat)
      const lng = firstNum(raw.longitude, raw.lng, raw.lon)
      if (lat != null && lng != null) {
        return distanceKm(viewerLat, viewerLng, lat, lng) <= radiusKm
      }
    }
    return false
  }

  if (hay.includes(cityNorm)) return true
  const tokens = cityNorm.split(" ").filter((t) => t.length >= 3)
  if (tokens.length === 0) return hay.includes(cityNorm)
  return tokens.some((t) => hay.includes(t))
}

function isFastDateSignal(raw: Record<string, unknown>): boolean {
  const blob = `${JSON.stringify(raw)}`.toLowerCase()
  if (/fast[\s_-]?date|date_card|datecard|cita|coffee|café|match\s+interest/i.test(blob))
    return true
  const title = rowGeoText(raw)
  return /\b(date|cita|coffee|café|drinks|drink)\b/i.test(title)
}

function isEventSignal(raw: Record<string, unknown>): boolean {
  return Boolean(firstStr(raw.eventId, raw.event_id, raw.meetup_id))
}

async function backendJson(
  backendBaseUrl: string,
  pathWithQuery: string,
  authHeader: string | null
): Promise<{ ok: boolean; data: unknown }> {
  const url = `${backendBaseUrl}${pathWithQuery}`
  const headers: Record<string, string> = { Accept: "application/json" }
  if (authHeader) headers.Authorization = authHeader
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return { ok: false, data: null }
    const data = await res.json().catch(() => null)
    return { ok: true, data }
  } catch {
    return { ok: false, data: null }
  }
}

function zoneBucket(raw: Record<string, unknown>): string {
  const z =
    firstStr(
      raw.zone,
      raw.neighborhood,
      raw.areaLabel,
      raw.city,
      raw.geo_location,
      raw.geoLocation,
      raw.locationZone
    ) || ""
  const first = z.split(/[,/|-]/)[0]?.trim()
  return (first || z || "City center").slice(0, 48)
}

export async function aggregateCityPulse(options: {
  backendBaseUrl: string
  authHeader: string | null
  city?: string
  lat?: number
  lng?: number
}): Promise<CityPulseResponse> {
  const cityNorm = options.city ? normCity(options.city) : ""
  const viewerLat = options.lat
  const viewerLng = options.lng

  const qGeo =
    viewerLat != null &&
    viewerLng != null &&
    Number.isFinite(viewerLat) &&
    Number.isFinite(viewerLng)
      ? `?lat=${encodeURIComponent(String(viewerLat))}&lng=${encodeURIComponent(String(viewerLng))}`
      : ""

  const partial = { v: false }

  const [nearbyR, trendingR, liveR, plansR, groupsR] = await Promise.all([
    backendJson(options.backendBaseUrl, `/api/activity/nearby${qGeo}`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/activity/trending${qGeo}`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/activity/live-users${qGeo}`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/activity/new-plans${qGeo}`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/groups/discover`, options.authHeader),
  ])

  if (!nearbyR.ok) partial.v = true
  if (!trendingR.ok) partial.v = true
  if (!liveR.ok) partial.v = true
  if (!plansR.ok) partial.v = true

  const nearby = unwrapList(nearbyR.data).filter((r) =>
    rowMatchesCityScope(r, cityNorm, viewerLat, viewerLng)
  )
  const trending = unwrapList(trendingR.data).filter((r) =>
    rowMatchesCityScope(r, cityNorm, viewerLat, viewerLng)
  )
  const liveUsers = unwrapList(liveR.data).filter((r) =>
    rowMatchesCityScope(r, cityNorm, viewerLat, viewerLng)
  )
  const plans = unwrapList(plansR.data).filter((r) =>
    rowMatchesCityScope(r, cityNorm, viewerLat, viewerLng)
  )

  const groupsRaw = groupsR.ok && Array.isArray(groupsR.data) ? (groupsR.data as Record<string, unknown>[]) : []
  const groups = groupsRaw.filter((g) => {
    const blob = `${firstStr(g.name, g.description, g.category) || ""}`.toLowerCase()
    if (!cityNorm) return true
    return blob.includes(cityNorm) || cityNorm.split(" ").some((t) => t.length >= 3 && blob.includes(t))
  })

  const activeIds = new Set<string>()
  for (const r of liveUsers) {
    const id = firstStr(r.userId, r.user_id, r.id)
    if (id) activeIds.add(id)
  }

  let ongoing_events_count = 0
  const trending_events: CityPulseTrendingEvent[] = []
  const eventRows = [...nearby, ...trending]
  for (const r of eventRows) {
    if (isEventSignal(r)) {
      ongoing_events_count++
      const title =
        firstStr(r.title, r.eventTitle, r.headline, r.name, r.label, r.snippet) || "Event"
      trending_events.push({
        event_id: firstStr(r.eventId, r.event_id),
        title,
        zone_label: firstStr(r.zone, r.city, r.geo_location, r.locationZone),
        engagement_hint: firstNum(r.engagement_score, r.engagementScore, r.score),
      })
    }
  }

  let fast_date_activity_count = 0
  for (const r of [...plans, ...trending]) {
    if (isFastDateSignal(r)) fast_date_activity_count++
  }

  const sevenDays = 7 * 86400000
  const now = Date.now()
  let recentGroups = 0
  for (const g of groups) {
    const ca = firstStr(g.createdAt, g.created_at)
    if (!ca) {
      recentGroups++
      continue
    }
    const t = new Date(ca).getTime()
    if (!Number.isNaN(t) && now - t <= sevenDays) recentGroups++
  }

  const metrics: CityPulseMetrics = {
    active_users_count: activeIds.size,
    ongoing_events_count,
    fast_date_activity_count,
    group_signals_count: groups.length,
    group_formation_rate: Math.min(5, recentGroups / 7),
  }

  const activity_score = computeActivityScore(metrics)

  const zoneCounts = new Map<string, number>()
  for (const r of [...nearby, ...trending, ...plans]) {
    const b = zoneBucket(r)
    zoneCounts.set(b, (zoneCounts.get(b) || 0) + 1)
  }
  const sortedZones = [...zoneCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxZ = sortedZones[0]?.[1] || 1
  const hot_zones: CityPulseHotZone[] = sortedZones.map(([label, signal_count]) => ({
    label,
    signal_count,
    intensity: Math.round((signal_count / maxZ) * 100),
  }))

  trending_events.sort((a, b) => (b.engagement_hint || 0) - (a.engagement_hint || 0))
  const seenEv = new Set<string>()
  const dedupedTrending: CityPulseTrendingEvent[] = []
  for (const ev of trending_events) {
    const k = ev.event_id || ev.title
    if (seenEv.has(k)) continue
    seenEv.add(k)
    dedupedTrending.push(ev)
  }

  const city_label =
    options.city?.trim() ||
    sortedZones[0]?.[0] ||
    (viewerLat != null && viewerLng != null ? "Your area" : "City")

  return {
    city_label,
    activity_score,
    metrics,
    trending_events: dedupedTrending.slice(0, 12),
    hot_zones,
    partial: partial.v,
    generated_at: new Date().toISOString(),
    recommendation_boost: pulseRecommendationBoost(activity_score),
  }
}
