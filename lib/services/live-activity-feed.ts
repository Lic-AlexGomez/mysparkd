import { api } from "@/lib/api"
import type { LiveFeedResponse } from "@/lib/types/live-activity-feed"

export const liveActivityFeedService = {
  /**
   * Unified live activity stream (BFF aggregation in Next proxy).
   * Query: lat, lng, limit — ranking blends proximity, recency, engagement.
   */
  get(params?: { lat?: number; lng?: number; limit?: number }) {
    const sp = new URLSearchParams()
    if (params?.lat != null && Number.isFinite(params.lat)) sp.set("lat", String(params.lat))
    if (params?.lng != null && Number.isFinite(params.lng)) sp.set("lng", String(params.lng))
    if (params?.limit != null && Number.isFinite(params.limit)) sp.set("limit", String(params.limit))
    const qs = sp.toString()
    return api.get<LiveFeedResponse>(`/api/activity/live-feed${qs ? `?${qs}` : ""}`)
  },
}
