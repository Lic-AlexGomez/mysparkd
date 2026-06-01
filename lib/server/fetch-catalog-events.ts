import { normalizeRowToSparkdEvent } from "@/lib/server/catalog-event-adapter"
import type { SparkdEvent } from "@/lib/types/sparkd-event"

function arrayFrom(obj: Record<string, unknown>, key: string): Record<string, unknown>[] | undefined {
  const v = obj[key]
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : undefined
}

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>
    const embedded = o._embedded
    if (embedded && typeof embedded === "object" && !Array.isArray(embedded)) {
      const fromEmb = arrayFrom(embedded as Record<string, unknown>, "events")
      if (fromEmb) return fromEmb
    }
    for (const key of ["content", "items", "events", "data", "records", "results", "payload", "rows"] as const) {
      const a = arrayFrom(o, key)
      if (a) return a
    }
    const nested = o.data
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const d = nested as Record<string, unknown>
      for (const key of ["content", "items", "events", "records", "results"] as const) {
        const a = arrayFrom(d, key)
        if (a) return a
      }
    }
  }
  return []
}

/** GET {base}/events with optional geo filters (upstream-tolerant). */
export async function fetchCatalogEvents(options: {
  catalogBaseUrl: string
  authHeader: string | null
  lat?: number
  lng?: number
  maxRows?: number
}): Promise<{ events: SparkdEvent[]; ok: boolean }> {
  // Allow larger requests when caller requests more rows. By default request a large window
  // so the aggregator can include as many catalog events as possible. Upstream may still
  // limit or paginate; this attempts to request all available rows in one page when asked.
  const max = options.maxRows ?? 1000
  // Choose a reasonable page size for upstream; request in pages until we collect `max` rows.
  const pageSize = Math.min(200, max)
  const baseUrl = options.catalogBaseUrl.replace(/\/$/, "")
  const headers: Record<string, string> = { Accept: "application/json" }
  /** Ezploro may require its own JWT; Sparkd’s token often is not valid upstream. */
  const catalogBearer =
    process.env.EZPLORO_API_TOKEN?.trim() ||
    process.env.EZPLORO_SERVER_BEARER?.trim() ||
    process.env.EZPLORO_BEARER_TOKEN?.trim()
  if (catalogBearer) headers.Authorization = `Bearer ${catalogBearer}`
  else if (options.authHeader) headers.Authorization = options.authHeader
  try {
    const events: SparkdEvent[] = []
    let page = 0
    while (events.length < max) {
      const params = new URLSearchParams()
      params.set("size", String(pageSize))
      params.set("page", String(page))
      if (
        options.lat != null &&
        options.lng != null &&
        Number.isFinite(options.lat) &&
        Number.isFinite(options.lng)
      ) {
        params.set("lat", String(options.lat))
        params.set("lng", String(options.lng))
      }
      const path = `/events?${params.toString()}`
      const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`

      const res = await fetch(url, { headers, signal: AbortSignal.timeout(14_000) })
      if (!res.ok) {
        // upstream failure — stop and return what we have
        console.log(`[fetchCatalogEvents] upstream non-ok page=${page} url=${url} status=${res.status}`)
        return { events, ok: false }
      }
      const data = await res.json().catch(() => null)
      const rows = unwrapList(data)
      console.log(`[fetchCatalogEvents] page=${page} url=${url} rowsFound=${rows.length} collected=${events.length}`)

      for (const raw of rows) {
        if (events.length >= max) break
        const ev = normalizeRowToSparkdEvent(raw)
        if (ev) events.push(ev)
      }

      // If upstream returned fewer rows than pageSize, we've reached the end.
      if (rows.length < pageSize) break
      page += 1
    }

    console.log(`[fetchCatalogEvents] mappedEvents=${events.length}`)
    return { events, ok: true }
  } catch (e) {
    console.log("[fetchCatalogEvents] error", e)
    return { events: [], ok: false }
  }
}
