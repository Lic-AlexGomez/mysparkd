import { computeCoreStreamRank, modeBucketBoost } from "@/lib/activity-core-ranking"
import type { ActivityCoreEvent, ActivityCoreExperienceMode } from "@/lib/types/activity-core-stream"
import type { SparkdEvent } from "@/lib/types/sparkd-event"
import type { TonightEventItem } from "@/lib/types/tonight"

function firstStr(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return undefined
}

/** Ezploro / Spring often use numeric or snake_case ids (`event_id`). */
function firstScalarId(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim()
    if (typeof v === "number" && Number.isFinite(v)) return String(v)
    if (typeof v === "bigint") return String(v)
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

/** Ezploro / GeoJSON: nested `location` with `coordinates` [lng, lat] or lat/lng fields. */
function readNestedLocation(raw: Record<string, unknown>): {
  latitude?: number
  longitude?: number
  zone?: string
} {
  const candidates = [raw.location, raw.venue, raw.place, raw.address]
  for (const loc of candidates) {
    if (!loc || typeof loc !== "object" || Array.isArray(loc)) continue
    const o = loc as Record<string, unknown>
    const zone = firstStr(
      o.formattedAddress,
      o.formatted_address,
      o.address,
      o.street,
      o.name,
      o.city,
      o.label
    )
    const flatLat = firstNum(o.latitude, o.lat)
    const flatLng = firstNum(o.longitude, o.lng, o.lon)
    if (flatLat != null && flatLng != null) return { latitude: flatLat, longitude: flatLng, zone }

    let coords: unknown = o.coordinates
    if (coords && typeof coords === "object" && !Array.isArray(coords)) {
      const inner = (coords as Record<string, unknown>).coordinates
      if (Array.isArray(inner)) coords = inner
    }
    if (Array.isArray(coords) && coords.length >= 2) {
      const a = firstNum(coords[0])
      const b = firstNum(coords[1])
      if (a == null || b == null) continue
      // GeoJSON Point: [lng, lat] when |lng|≤180 and |lat|≤90
      if (Math.abs(a) <= 180 && Math.abs(b) <= 90) return { longitude: a, latitude: b, zone }
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { latitude: a, longitude: b, zone }
    }

    if (zone) return { zone }
  }

  const geom = raw.geometry
  if (geom && typeof geom === "object" && !Array.isArray(geom)) {
    const g = (geom as { coordinates?: unknown }).coordinates
    if (Array.isArray(g) && g.length >= 2) {
      const a = firstNum(g[0])
      const b = firstNum(g[1])
      if (a != null && b != null && Math.abs(a) <= 180 && Math.abs(b) <= 90) {
        return { longitude: a, latitude: b }
      }
    }
  }
  return {}
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

/** Map one upstream event row into Sparkd canonical shape (field-tolerant). */
export function normalizeRowToSparkdEvent(raw: Record<string, unknown>): SparkdEvent | null {
  const id = firstScalarId(
    raw.id,
    raw.eventId,
    raw.event_id,
    raw.uuid,
    raw.eventUuid,
    raw.event_uuid,
    raw._id
  )
  if (!id) return null
  const nestedLoc = readNestedLocation(raw)
  const title =
    firstStr(
      raw.title,
      raw.name,
      raw.eventTitle,
      raw.event_title,
      raw.headline
    ) || "Event"
  const starts_at = firstStr(
    raw.startsAt,
    raw.starts_at,
    raw.startTime,
    raw.eventTime,
    raw.beginAt,
    raw.scheduledStart,
    raw.date_time,
    raw.dateTime,
    raw.startDate,
    raw.start_date
  )
  const ends_at = firstStr(
    raw.endsAt,
    raw.ends_at,
    raw.endTime,
    raw.scheduledEnd,
    raw.endDate,
    raw.end_date
  )
  const zone_label = firstStr(
    nestedLoc.zone,
    raw.zone,
    raw.locationZone,
    raw.officialAddress,
    raw.venueLabel,
    raw.venue_label,
    raw.city,
    raw.address,
    typeof raw.location === "string" ? raw.location : undefined
  )
  const latitude = firstNum(raw.latitude, raw.lat, nestedLoc.latitude)
  const longitude = firstNum(raw.longitude, raw.lng, raw.lon, nestedLoc.longitude)
  const attendee_count = firstNum(
    raw.currentApprovedCount,
    raw.attendeeCount,
    raw.participantCount,
    raw.confirmedCount,
    raw.rsvpCount
  )
  const momentum = firstNum(raw.activityScore, raw.activity_score, raw.engagementScore, raw.score)
  const summary = firstStr(raw.description, raw.summary)?.slice(0, 280)
  const organizerName = (() => {
    const name = firstStr(
      raw.creatorUsername,
      (raw.organizer as Record<string, unknown>)?.username,
      raw.organizerName,
      raw.organizer_name,
    )
    return name && !/^ezploro$/i.test(name) ? name : undefined
  })()
  const likesCount = firstNum(raw.likesCount, raw.likes_count, raw.likes)

  return {
    id: String(id),
    title,
    summary,
    starts_at,
    ends_at,
    zone_label,
    latitude: latitude ?? undefined,
    longitude: longitude ?? undefined,
    attendee_count: attendee_count != null ? Math.floor(attendee_count) : undefined,
    momentum: momentum != null ? Math.min(100, Math.max(0, momentum)) : undefined,
    href: `/events/${encodeURIComponent(String(id))}`,
    cover_image_url: firstStr(raw.cover_image as string, raw.coverImage as string, raw.coverImageUrl as string, raw.image as string, raw.imageUrl as string) ?? null,
    price: firstStr(raw.price as string),
    category: firstStr(raw.category as string),
    address: firstStr(raw.address as string, raw.address2 as string),
    city: firstStr(raw.city as string, raw.state as string),
    organizerName,
    likesCount: likesCount != null ? Math.floor(likesCount) : undefined,
  }
}

export function sparkdEventToTonightItem(ev: SparkdEvent, viewerLat?: number, viewerLng?: number): TonightEventItem {
  let distanceKm: number | undefined
  if (
    viewerLat != null &&
    viewerLng != null &&
    ev.latitude != null &&
    ev.longitude != null &&
    Number.isFinite(viewerLat) &&
    Number.isFinite(viewerLng)
  ) {
    distanceKm = haversineKm(viewerLat, viewerLng, ev.latitude, ev.longitude)
  }
  return {
    id: ev.id,
    title: ev.title,
    eventTime: ev.starts_at,
    endTime: ev.ends_at,
    venueLabel: ev.city ?? ev.zone_label,
    distanceKm,
    activityScore: ev.momentum,
    realTimeStatus: ev.starts_at ? "STARTING_SOON" : "PLANNING",
    coverImageUrl: ev.cover_image_url ?? null,
    attendeePreviewCount: ev.attendee_count,
    price: ev.price,
    category: ev.category,
    summary: ev.summary,
    organizerName: ev.organizerName,
    likesCount: ev.likesCount,
  }
}

export function sparkdEventToActivityCoreCatalog(
  ev: SparkdEvent,
  pulseActivity: number,
  nowMs: number,
  mode: ActivityCoreExperienceMode = "BOTH",
  viewerLat?: number,
  viewerLng?: number
): ActivityCoreEvent {
  let proximityKm: number | undefined
  if (
    viewerLat != null &&
    viewerLng != null &&
    ev.latitude != null &&
    ev.longitude != null &&
    Number.isFinite(viewerLat) &&
    Number.isFinite(viewerLng)
  ) {
    proximityKm = haversineKm(viewerLat, viewerLng, ev.latitude, ev.longitude)
  }
  const engagement0to100 = ev.momentum ?? Math.min(90, 42 + (ev.attendee_count ?? 0) * 3)
  const r = computeCoreStreamRank({
    timestampIso: ev.starts_at,
    proximityKm,
    engagement0to100,
    pulseActivity0to100: pulseActivity,
    nowMs,
    mode,
    bucketBoost: modeBucketBoost(mode, "events") * 1.08,
  })
  return {
    id: ev.id,
    title: ev.title,
    subtitle: ev.zone_label,
    href: ev.href,
    time_window: ev.zone_label,
    timestamp: ev.starts_at,
    source: "catalog",
    ...r,
  }
}
