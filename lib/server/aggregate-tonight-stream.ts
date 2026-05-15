import { sparkdEventToTonightItem } from "@/lib/server/catalog-event-adapter"
import { backendJson } from "@/lib/server/backend-fetch"
import { fetchCatalogEvents } from "@/lib/server/fetch-catalog-events"
import { getEventInfrastructureBaseUrl } from "@/lib/server/event-infrastructure-url"
import type {
  TonightActiveUserItem,
  TonightEventItem,
  TonightGroupItem,
  TonightPlanItem,
  TonightStreamResponse,
} from "@/lib/types/tonight"

function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === "object" && Array.isArray((raw as { content?: unknown }).content)) {
    return (raw as { content: T[] }).content
  }
  return []
}

export async function aggregateTonightStream(options: {
  sparkdBackendUrl: string
  catalogBaseUrl?: string
  authHeader: string | null
  lat?: number
  lng?: number
}): Promise<TonightStreamResponse> {
  const catalogBase = options.catalogBaseUrl ?? getEventInfrastructureBaseUrl()
  const hasGeo =
    options.lat != null &&
    options.lng != null &&
    Number.isFinite(options.lat) &&
    Number.isFinite(options.lng)
  const q = hasGeo ? `?lat=${options.lat}&lng=${options.lng}` : ""

  const [cat, tev, users, groups, plans] = await Promise.all([
    fetchCatalogEvents({
      catalogBaseUrl: catalogBase,
      authHeader: options.authHeader,
      lat: hasGeo ? options.lat : undefined,
      lng: hasGeo ? options.lng : undefined,
      maxRows: 400,
    }),
    backendJson(options.sparkdBackendUrl, `/api/events${q}`, options.authHeader),
    backendJson(options.sparkdBackendUrl, `/api/tonight/active-users${q}`, options.authHeader),
    backendJson(options.sparkdBackendUrl, `/api/tonight/groups${q}`, options.authHeader),
    backendJson(options.sparkdBackendUrl, `/api/tonight/plans${q}`, options.authHeader),
  ])

  const sparkdTonight = tev.ok ? unwrapArray<TonightEventItem>(tev.data) : []
  const fromCatalog = cat.events.map((e) =>
    sparkdEventToTonightItem(e, hasGeo ? options.lat : undefined, hasGeo ? options.lng : undefined)
  )
  function tonightEventKey(e: TonightEventItem): string | null {
    if (e?.id != null && String(e.id).trim()) return String(e.id)
    const alt = (e as { eventId?: unknown }).eventId
    if (alt != null && String(alt).trim()) return String(alt)
    return null
  }
  const now = new Date()

  console.log(
    "[aggregateTonightStream] catalogCount:",
    fromCatalog.length,
    "sparkdCount:",
    sparkdTonight.length,
  )

  // Build a map of events keyed by id so we can prefer catalog events with images over Sparkd events without.
  const byId = new Map<string, TonightEventItem>()
  for (const e of fromCatalog) {
    const k = tonightEventKey(e)
    if (k != null) byId.set(k, e)
  }

  let replacedCount = 0
  for (const e of sparkdTonight) {
    const k = tonightEventKey(e)
    if (k == null) continue
    const existing = byId.get(k)

    const isFuture = (ev?: TonightEventItem) => {
      if (!ev) return false
      try {
        const s = ev.eventTime ? new Date(ev.eventTime) : null
        const t = ev.endTime ? new Date(ev.endTime) : null
        return (s && s >= now) || (t && t >= now)
      } catch {
        return false
      }
    }

    if (!existing) {
      // Check if a catalog event with the same title already exists (different ID from different source)
      const titleDup = Array.from(byId.values()).find(
        c => c.title.toLowerCase().trim() === (e.title || '').toLowerCase().trim()
      )
      if (titleDup) {
        // Catalog already has this event — skip backend version
        continue
      }
      byId.set(k, e)
      continue
    }

    // Prefer events that have images (real events) over those without (test/placeholder)
    const existingHasImage = !!existing.coverImageUrl
    const backendHasImage = !!e.coverImageUrl

    if (existingHasImage && !backendHasImage) {
      // Keep catalog event that has an image, skip backend event without
      continue
    }
    if (backendHasImage && !existingHasImage) {
      // Backend event has image but catalog doesn't — prefer backend
      byId.set(k, e)
      replacedCount += 1
      continue
    }
    // Both have images: prefer the catalog version (richer data like summary, organizerName)
    continue
  }

  const events = Array.from(byId.values())

  console.log(
    "[aggregateTonightStream] catalogCount:",
    fromCatalog.length,
    "sparkdCount:",
    sparkdTonight.length,
    "finalCount:",
    events.length,
    "replacedByBackend:",
    replacedCount
  )

  // Debug samples: print first few items to help trace date fields
  try {
    console.log(
      "[aggregateTonightStream] sample fromCatalog:",
      fromCatalog.slice(0, 6).map((e) => ({ id: e.id, eventTime: e.eventTime }))
    )
  } catch {}
  try {
    console.log(
      "[aggregateTonightStream] sample sparkdTonight:",
      sparkdTonight.slice(0, 6).map((e) => ({ id: e.id, eventTime: (e as any).eventTime || (e as any).date_time || null }))
    )
  } catch {}

  const partial = Boolean(!cat.ok || !tev.ok || !users.ok || !groups.ok || !plans.ok)

  return {
    events,
    active_users: users.ok ? unwrapArray<TonightActiveUserItem>(users.data) : [],
    groups: groups.ok ? unwrapArray<TonightGroupItem>(groups.data) : [],
    plans: plans.ok ? unwrapArray<TonightPlanItem>(plans.data) : [],
    meta: {
      generated_at: new Date().toISOString(),
      partial,
    },
  }
}
