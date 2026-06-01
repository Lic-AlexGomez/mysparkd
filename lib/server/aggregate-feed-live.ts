import { aggregateLiveFeed } from "@/lib/server/live-feed-aggregator"
import { fetchCatalogEvents } from "@/lib/server/fetch-catalog-events"
import { getEventInfrastructureBaseUrl } from "@/lib/server/event-infrastructure-url"
import type { FeedLiveResponse } from "@/lib/types/feed-live"

export async function aggregateFeedLive(options: {
  backendBaseUrl: string
  catalogBaseUrl?: string
  authHeader: string | null
  lat?: number
  lng?: number
  limit?: number
}): Promise<FeedLiveResponse> {
  const catalogBase = options.catalogBaseUrl ?? getEventInfrastructureBaseUrl()
  const hasGeo =
    options.lat != null &&
    options.lng != null &&
    Number.isFinite(options.lat) &&
    Number.isFinite(options.lng)
  const liveLimit = Math.min(48, Math.max(16, options.limit ?? 28))

  const [live, cat] = await Promise.all([
    aggregateLiveFeed({
      backendBaseUrl: options.backendBaseUrl,
      authHeader: options.authHeader,
      lat: hasGeo ? options.lat : undefined,
      lng: hasGeo ? options.lng : undefined,
      limit: liveLimit,
    }),
    fetchCatalogEvents({
      catalogBaseUrl: catalogBase,
      authHeader: options.authHeader,
      lat: hasGeo ? options.lat : undefined,
      lng: hasGeo ? options.lng : undefined,
      maxRows: 40,
    }),
  ])

  const partial = Boolean(live.meta.partial || !cat.ok)

  return {
    events: cat.events,
    activity: live.items.slice(0, liveLimit),
    meta: {
      generated_at: new Date().toISOString(),
      partial,
    },
  }
}
