import { api } from "@/lib/api"
import type {
  TonightActiveUserItem,
  TonightEventItem,
  TonightGroupItem,
  TonightPlanItem,
  TonightStreamResponse,
} from "@/lib/types/tonight"

function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.content)) return obj.content as T[]
    if (Array.isArray(obj.events)) return obj.events as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
  }
  return []
}

async function safeGet<T>(path: string): Promise<T[]> {
  try {
    const data = await api.get<unknown>(path)
    return unwrapArray<T>(data)
  } catch {
    return []
  }
}

/**
 * Traduce un evento crudo de EventResponseDTO / EventSummaryDTO (Sparkd backend)
 * al formato TonightEventItem que espera la UI.
 * También acepta TonightEventItem ya mapeado (para preservar campos al pasar por segunda vez).
 */
function mapSparkdEventToTonightEvent(event: any): TonightEventItem {
  const org = event.organizerName || event.creatorUsername || event.organizer?.username
  return {
    id: String(event.id || event.eventId || event.event_id || ""),
    title: event.title || event.name || "Evento",
    eventTime: event.eventTime || event.eventDate || event.startsAt || event.date_time || event.dateTime,
    endTime: event.endTime || event.endsAt || event.end_date_time || event.endDate,
    venueLabel: event.venueLabel || event.zone || event.locationZone || event.officialAddress || event.exactAddress || event.city || event.province || event.country || "Ubicación pendiente",
    distanceKm: event.distanceKm ?? event.distance_km,
    activityScore: event.activityScore ?? event.activity_score,
    realTimeStatus: event.realTimeStatus || event.real_time_status || "LIVE",
    coverImageUrl: event.coverImageUrl || event.coverPhotoUrl || event.cover_image || event.image || event.coverPhoto,
    attendeePreviewCount: event.attendeePreviewCount ?? event.currentApprovedCount ?? event.attendees_count ?? event.interested_count ?? 0,
    price: event.price != null ? String(event.price) : (event.free === true ? "0" : event.price || "0"),
    category: event.category,
    summary: event.summary || event.description || event.resume || undefined,
    organizerName: org && !/^ezploro$/i.test(org) ? org : undefined,
    likesCount: event.likesCount ?? event.likes_count ?? event.likes ?? 0,
  }
}

// ═══════════════════════════════════════════════════════════════
//  RUTAS COMENTADAS — no existen en el backend repo
//  (C:\Sparkd1.0-desarrollo (1)\Sparkd1.0)
//
//  GET /api/tonight/events         → no existe
//  GET /api/tonight/active-users   → no existe
//  GET /api/tonight/groups         → no existe
//  GET /api/tonight/plans          → no existe
//
//  En su lugar se usan los endpoints reales de /api/events/*
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene el feed público de eventos desde /api/events (GET).
 * Soportafiltros: lat, lng, radiusKm, minAge, maxAge, free, category.
 * @see sparkd.Controllers.EventController#getEventFeed
 */
export async function fetchTonightEvents(lat?: number, lng?: number): Promise<TonightEventItem[]> {
  const params = new URLSearchParams()
  if (lat != null) params.set("lat", String(lat))
  if (lng != null) params.set("lng", String(lng))
  const qs = params.toString()
  const url = `/api/tonight/ezploro${qs ? `?${qs}` : ""}`

  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const json = await res.json()
    const raw = unwrapArray<any>(json.events ?? json)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return raw
      .map(mapSparkdEventToTonightEvent)
      .filter((ev) => {
        if (!ev.eventTime) return true
        return new Date(ev.eventTime) >= yesterday
      })
  } catch {
    return []
  }
}

/**
 * ⛔ NO IMPLEMENTADO — no existe endpoint equivalente en el backend Sparkd.
 * Los usuarios activos cerca no están disponibles.
 * Se deja la función para que retorne [] sin romper imports.
 */
export async function fetchTonightActiveUsers(lat?: number, lng?: number): Promise<TonightActiveUserItem[]> {
  // endpoint no disponible
  return []
}

/**
 * ⛔ NO IMPLEMENTADO — no existe endpoint equivalente en el backend Sparkd.
 * Los grupos "tonight" no están disponibles.
 */
export async function fetchTonightGroups(lat?: number, lng?: number): Promise<TonightGroupItem[]> {
  return []
}

/**
 * ⛔ NO IMPLEMENTADO — no existe endpoint equivalente en el backend Sparkd.
 * Los planes "tonight" no están disponibles.
 */
export async function fetchTonightPlans(lat?: number, lng?: number): Promise<TonightPlanItem[]> {
  return []
}

/** Bundled tonight surface: usa Next.js BFF (/api/tonight/stream) que internamente puede llamar a /api/events. */
export async function fetchTonightStream(lat?: number, lng?: number): Promise<TonightStreamResponse | null> {
  const q =
    lat != null && lng != null ? `?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}` : ""
  const token = typeof window !== "undefined" ? window.localStorage.getItem("sparkd_token") : null
  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    const res = await fetch(`/api/tonight/stream${q}`, { headers })
    if (!res.ok) return null
    const json = await res.json()
    const events = Array.isArray(json.events) ? json.events : []
    const mappedEvents = events.map(mapSparkdEventToTonightEvent)
    return {
      ...json,
      events: mappedEvents,
    } as TonightStreamResponse
  } catch {
    return null
  }
}
