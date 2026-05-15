import type {
  LiveFeedActor,
  LiveFeedItem,
  LiveFeedMeta,
  LiveFeedResponse,
  LiveFeedVerb,
} from "@/lib/types/live-activity-feed"

const WEIGHTS_DEFAULT = { engagement: 0.4, recency: 0.35, proximity: 0.25 }

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.content)) return o.content as Record<string, unknown>[]
    if (Array.isArray(o.pulses)) return o.pulses as Record<string, unknown>[]
    if (Array.isArray(o.items)) return o.items as Record<string, unknown>[]
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

function isoTimestamp(raw: Record<string, unknown>): string {
  const s = firstStr(
    raw.activity_timestamp,
    raw.activityTimestamp,
    raw.createdAt,
    raw.created_at,
    raw.updatedAt,
    raw.updated_at,
    raw.sentAt
  )
  if (s) {
    const t = Date.parse(s)
    if (!Number.isNaN(t)) return new Date(t).toISOString()
  }
  return new Date().toISOString()
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function proximityFromRaw(
  raw: Record<string, unknown>,
  viewerLat?: number,
  viewerLng?: number
): number | undefined {
  if (viewerLat == null || viewerLng == null || !Number.isFinite(viewerLat) || !Number.isFinite(viewerLng))
    return undefined
  const lat = firstNum(raw.latitude, raw.lat)
  const lng = firstNum(raw.longitude, raw.lng, raw.lon)
  if (lat == null || lng == null) return undefined
  return distanceKm(viewerLat, viewerLng, lat, lng)
}

function engagementFromRaw(raw: Record<string, unknown>): number {
  const v = firstNum(raw.engagement_score, raw.engagementScore, raw.score, raw.activity_score, raw.activityScore)
  if (v == null) return 35
  return Math.min(100, Math.max(0, v))
}

function buildHref(raw: Record<string, unknown>): string | undefined {
  const href = firstStr(raw.href, raw.link, raw.url)
  if (href) return href
  const eventId = firstStr(raw.eventId, raw.event_id)
  if (eventId) return `/events/${eventId}`
  const groupId = firstStr(raw.groupId, raw.group_id)
  if (groupId) return `/groups/${groupId}`
  const userId = firstStr(raw.userId, raw.user_id)
  if (userId) return `/profile/${userId}`
  return undefined
}

function actorsFromRaw(raw: Record<string, unknown>): LiveFeedActor[] | undefined {
  const uid = firstStr(raw.userId, raw.user_id)
  const uname = firstStr(raw.username, raw.senderUsername, raw.authorUsername)
  const avatar = firstStr(raw.profilePictureUrl, raw.photoUrl, raw.avatarUrl)
  if (!uid && !uname) return undefined
  return [{ userId: uid, username: uname, avatarUrl: avatar }]
}

function inferJoinVerb(raw: Record<string, unknown>): LiveFeedVerb {
  const hint =
    `${firstStr(raw.action, raw.verb, raw.kind, raw.label, raw.snippet, raw.activityHint) || ""}`.toLowerCase()
  if (/join|rsvp|asist|going|attend/i.test(hint)) return "event_join"
  return "event_created"
}

function headlineEvent(raw: Record<string, unknown>, verb: LiveFeedVerb): string {
  const title =
    firstStr(raw.title, raw.eventTitle, raw.name, raw.headline, raw.label) || "Event"
  const user = firstStr(raw.username, raw.actorUsername, raw.senderUsername)
  if (verb === "event_join" && user)
    return `${user} joined an event`
  if (verb === "event_join") return `Someone joined "${title}"`
  return `New event nearby: ${title}`
}

function headlineUserActive(raw: Record<string, unknown>): string {
  const user = firstStr(raw.username, raw.name, raw.headline, raw.title) || "Someone"
  return `${user} is active nearby`
}

function headlineTrending(raw: Record<string, unknown>): string {
  const title = firstStr(raw.title, raw.headline, raw.label, raw.snippet, raw.planning_snippet) || "Trending plan"
  return title.length > 72 ? `${title.slice(0, 69)}…` : title
}

function headlinePlan(raw: Record<string, unknown>): string {
  const title = firstStr(raw.title, raw.headline, raw.venue_label, raw.name) || "New plan forming"
  return title.length > 80 ? `${title.slice(0, 77)}…` : title
}

function mapNearbyRow(
  raw: Record<string, unknown>,
  idx: number,
  viewerLat?: number,
  viewerLng?: number
): LiveFeedItem | null {
  const id =
    firstStr(raw.id, raw.eventId, raw.userId, raw.groupId, raw.planId) || `nearby-${idx}`
  const verb = inferJoinVerb(raw)
  const headline = headlineEvent(raw, verb)
  const timestamp = isoTimestamp(raw)
  const pk = proximityFromRaw(raw, viewerLat, viewerLng)
  const distKm = pk ?? firstNum(raw.distance_km, raw.distanceKm)
  const engagement = engagementFromRaw(raw)
  const eventId = firstStr(raw.eventId, raw.event_id)

  return {
    id: String(id),
    verb,
    headline,
    subtitle: firstStr(raw.subtitle, raw.zone, raw.city, raw.geo_location, raw.geoLocation, raw.venueLabel),
    href: buildHref(raw),
    timestamp,
    actors: actorsFromRaw(raw),
    target: eventId ? { type: "event", id: eventId, title: firstStr(raw.eventTitle, raw.title) } : undefined,
    proximityKm: distKm,
    engagementScore: engagement,
    rankScore: 0,
    source: "activity/nearby",
  }
}

function mapLiveUserRow(
  raw: Record<string, unknown>,
  idx: number,
  viewerLat?: number,
  viewerLng?: number
): LiveFeedItem | null {
  const id = firstStr(raw.id, raw.userId, raw.user_id) || `live-${idx}`
  const pk = proximityFromRaw(raw, viewerLat, viewerLng)
  const uid = firstStr(raw.userId, raw.user_id)
  const u1 = firstStr(raw.username, raw.userA, raw.user_a)
  const u2 = firstStr(raw.matchedUsername, raw.peerUsername, raw.userB, raw.user_b)
  if (u1 && u2) {
    return {
      id: String(id),
      verb: "match",
      headline: `${u1} matched with ${u2}`,
      subtitle: firstStr(raw.activityHint, raw.zone, raw.city),
      href: buildHref(raw) || "/matches",
      timestamp: isoTimestamp(raw),
      actors: [
        { userId: uid, username: u1 },
        { username: u2 },
      ],
      proximityKm: pk ?? firstNum(raw.distance_km, raw.distanceKm),
      engagementScore: engagementFromRaw(raw),
      rankScore: 0,
      source: "activity/live-users",
    }
  }

  const headline = headlineUserActive(raw)

  return {
    id: String(id),
    verb: "user_active",
    headline,
    subtitle: firstStr(raw.activityHint, raw.zone, raw.city, raw.geoLabel),
    href: buildHref(raw),
    timestamp: isoTimestamp(raw),
    actors: actorsFromRaw(raw),
    target: uid ? { type: "user", id: uid } : undefined,
    proximityKm: pk ?? firstNum(raw.distance_km, raw.distanceKm),
    engagementScore: engagementFromRaw(raw),
    rankScore: 0,
    source: "activity/live-users",
  }
}

function mapTrendingRow(
  raw: Record<string, unknown>,
  idx: number,
  viewerLat?: number,
  viewerLng?: number
): LiveFeedItem | null {
  const id = firstStr(raw.id, raw.planId, raw.eventId) || `trend-${idx}`
  return {
    id: String(id),
    verb: "trending_plan",
    headline: headlineTrending(raw),
    subtitle: firstStr(raw.zone, raw.city, raw.activityHint),
    href: buildHref(raw),
    timestamp: isoTimestamp(raw),
    actors: actorsFromRaw(raw),
    proximityKm: proximityFromRaw(raw, viewerLat, viewerLng) ?? firstNum(raw.distance_km, raw.distanceKm),
    engagementScore: engagementFromRaw(raw),
    rankScore: 0,
    source: "activity/trending",
  }
}

function mapPlanRow(
  raw: Record<string, unknown>,
  idx: number,
  viewerLat?: number,
  viewerLng?: number
): LiveFeedItem | null {
  const id = firstStr(raw.id, raw.planId, raw.groupId) || `plan-${idx}`
  const bucket = firstStr(raw.zone, raw.city, raw.geo_location, raw.geoLocation, raw.areaLabel) || "Nearby"

  return {
    id: String(id),
    verb: "social_pulse",
    headline: headlinePlan(raw),
    subtitle: bucket,
    href: buildHref(raw) || "/tonight",
    timestamp: isoTimestamp(raw),
    proximityKm: proximityFromRaw(raw, viewerLat, viewerLng) ?? firstNum(raw.distance_km, raw.distanceKm),
    engagementScore: engagementFromRaw(raw),
    rankScore: 0,
    source: "activity/new-plans",
  }
}

/** Merge multiple “planning” rows into one pulse when several land in the same zone bucket. */
function clusterPlanning(items: LiveFeedItem[]): LiveFeedItem[] {
  const others: LiveFeedItem[] = []
  const plans: LiveFeedItem[] = []
  for (const it of items) {
    if (it.source === "activity/new-plans") plans.push(it)
    else others.push(it)
  }

  const byZone = new Map<string, LiveFeedItem[]>()
  for (const p of plans) {
    const key = (p.subtitle || "nearby").toLowerCase().slice(0, 64)
    const arr = byZone.get(key) ?? []
    arr.push(p)
    byZone.set(key, arr)
  }

  const planOut: LiveFeedItem[] = []
  for (const [, group] of byZone) {
    if (group.length >= 3) {
      const zone = group[0]?.subtitle || "Nearby"
      const newest = [...group].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]
      const kms = group.map((g) => g.proximityKm).filter((x): x is number => x != null && Number.isFinite(x))
      planOut.push({
        id: `cluster:${zone}:${group.length}:${newest.timestamp}`,
        verb: "planning_cluster",
        headline: `${group.length} people are planning tonight`,
        subtitle: zone,
        href: "/tonight",
        timestamp: newest.timestamp,
        proximityKm: medianKm(kms),
        engagementScore: Math.max(...group.map((g) => g.engagementScore)),
        rankScore: 0,
        source: "aggregation/planning-cluster",
      })
    } else {
      planOut.push(...group)
    }
  }

  return [...others, ...planOut]
}

function medianKm(vals: number[]): number | undefined {
  if (vals.length === 0) return undefined
  const s = [...vals].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function computeRankScore(
  item: LiveFeedItem,
  nowMs: number,
  weights: LiveFeedMeta["weights"]
): number {
  const eng = Math.min(100, Math.max(0, item.engagementScore)) / 100
  const ageMs = Math.max(0, nowMs - new Date(item.timestamp).getTime())
  const recency = Math.exp(-ageMs / (2 * 60 * 60 * 1000))
  let prox = 0.45
  if (item.proximityKm != null && Number.isFinite(item.proximityKm)) {
    prox = 1 / (1 + item.proximityKm / 8)
  }
  return weights.engagement * eng + weights.recency * recency + weights.proximity * prox
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

export async function aggregateLiveFeed(options: {
  backendBaseUrl: string
  authHeader: string | null
  lat?: number
  lng?: number
  limit?: number
  weights?: LiveFeedMeta["weights"]
}): Promise<LiveFeedResponse> {
  const limit = Math.min(60, Math.max(4, options.limit ?? 24))
  const weights = options.weights ?? WEIGHTS_DEFAULT
  const qGeo =
    options.lat != null &&
    options.lng != null &&
    Number.isFinite(options.lat) &&
    Number.isFinite(options.lng)
      ? `?lat=${encodeURIComponent(String(options.lat))}&lng=${encodeURIComponent(String(options.lng))}`
      : ""

  const meta: LiveFeedMeta = { weights, partial: false, sourceEndpoints: [] }
  const endpoints = [
    `/api/activity/nearby${qGeo}`,
    `/api/activity/trending${qGeo}`,
    `/api/activity/live-users${qGeo}`,
    `/api/activity/new-plans${qGeo}`,
  ] as const

  const results = await Promise.all([
    ...endpoints.map((p) => backendJson(options.backendBaseUrl, p, options.authHeader)),
    backendJson(options.backendBaseUrl, `/api/groups/discover`, options.authHeader),
  ])

  const items: LiveFeedItem[] = []
  let idx = 0

  if (results[0].ok && results[0].data) {
    meta.sourceEndpoints!.push("nearby")
    unwrapList(results[0].data).forEach((raw) => {
      const m = mapNearbyRow(raw, idx++, options.lat, options.lng)
      if (m) items.push(m)
    })
  } else meta.partial = true

  if (results[1].ok && results[1].data) {
    meta.sourceEndpoints!.push("trending")
    unwrapList(results[1].data).forEach((raw) => {
      const m = mapTrendingRow(raw, idx++, options.lat, options.lng)
      if (m) items.push(m)
    })
  } else meta.partial = true

  if (results[2].ok && results[2].data) {
    meta.sourceEndpoints!.push("live-users")
    unwrapList(results[2].data).forEach((raw) => {
      const m = mapLiveUserRow(raw, idx++, options.lat, options.lng)
      if (m) items.push(m)
    })
  } else meta.partial = true

  if (results[3].ok && results[3].data) {
    meta.sourceEndpoints!.push("new-plans")
    unwrapList(results[3].data).forEach((raw) => {
      const m = mapPlanRow(raw, idx++, options.lat, options.lng)
      if (m) items.push(m)
    })
  } else meta.partial = true

  const groupsRaw = results[4]?.data
  const groupRows = Array.isArray(groupsRaw) ? groupsRaw : unwrapList(groupsRaw)
  if (results[4]?.ok && groupRows.length > 0) {
    meta.sourceEndpoints!.push("groups-discover")
    groupRows.slice(0, 10).forEach((raw) => {
      const gid = firstStr(raw.id, raw.groupId)
      const name = firstStr(raw.name, raw.title) || "Group"
      if (!gid) return
      items.push({
        id: `grp-${gid}`,
        verb: "group_created",
        headline: `New group nearby: ${name}`,
        subtitle: firstStr(raw.creatorUsername, raw.category),
        href: `/groups/${gid}`,
        timestamp: isoTimestamp(raw),
        actors: firstStr(raw.creatorId)
          ? [
              {
                userId: firstStr(raw.creatorId),
                username: firstStr(raw.creatorUsername),
                avatarUrl: firstStr(raw.creatorProfilePictureUrl),
              },
            ]
          : undefined,
        target: { type: "group", id: gid, title: name },
        proximityKm: proximityFromRaw(raw, options.lat, options.lng),
        engagementScore: Math.min(100, 25 + (firstNum(raw.memberCount) ?? 0) * 2),
        rankScore: 0,
        source: "groups/discover",
      })
    })
  }

  let merged = clusterPlanning(items)

  const seen = new Set<string>()
  merged = merged.filter((it) => {
    const k = `${it.verb}:${it.id}:${it.headline.slice(0, 40)}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  const now = Date.now()
  merged.forEach((it) => {
    it.rankScore = Number(computeRankScore(it, now, weights).toFixed(4))
  })
  merged.sort((a, b) => b.rankScore - a.rankScore)

  return {
    items: merged.slice(0, limit),
    generatedAt: new Date().toISOString(),
    meta,
  }
}
