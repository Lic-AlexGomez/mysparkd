import type { FeedLiveResponse } from "@/lib/types/feed-live"
import type { SparkdEvent } from "@/lib/types/sparkd-event"

function mapBackendEventToSparkdEvent(event: any): SparkdEvent {
  return {
    id: String(event.event_id || event.id),
    title: event.title || "Evento",
    href: event.href || `/events/${event.event_id || event.id}`,
    starts_at: event.date_time || event.starts_at,
    ends_at: event.end_date_time || event.ends_at,
    cover_image_url: event.cover_image || event.cover_image_url,
    zone_label:
      event.address ||
      event.zone_label ||
      event.city ||
      event.country ||
      "Ubicación pendiente",
    attendee_count:
      event.attendees_count ||
      event.interested_count ||
      event.attendee_count ||
      0,
    category: event.category || null,
    price: event.price || "0",
    momentum: event.momentum || 0,
    latitude: event.latitude,
    longitude: event.longitude,
    address: event.address,
    city: event.city,
    summary: event.summary,
  }
}

/** Next BFF: catalog-backed `events` + ranked `activity` slice. */
export async function fetchFeedLive(opts: {
  lat?: number
  lng?: number
  limit?: number
}): Promise<FeedLiveResponse | null> {
  const q = new URLSearchParams()
  if (
    opts.lat != null &&
    opts.lng != null &&
    Number.isFinite(opts.lat) &&
    Number.isFinite(opts.lng)
  ) {
    q.set("lat", String(opts.lat))
    q.set("lng", String(opts.lng))
  }
  if (opts.limit != null && Number.isFinite(opts.limit)) q.set("limit", String(opts.limit))
  const qs = q.toString()
  const token = typeof window !== "undefined" ? window.localStorage.getItem("sparkd_token") : null
  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    const res = await fetch(`/api/feed/live${qs ? `?${qs}` : ""}`, { headers })
    if (!res.ok) return null
    const json = await res.json()
    
    // Handle different response formats
    let rawEvents: any[] = []
    if (Array.isArray(json)) {
      rawEvents = json
    } else if (json && typeof json === "object") {
      rawEvents = json.events || json.content || json.data || []
    }
    
    const mappedEvents = rawEvents.map(mapBackendEventToSparkdEvent)
    
    return {
      ...json,
      events: mappedEvents,
    } as FeedLiveResponse
  } catch {
    return null
  }
}
