"use client"

import { useCallback, useEffect, useState } from "react"
import { liveActivityFeedService } from "@/lib/services/live-activity-feed"
import type { LiveFeedItem, LiveFeedResponse } from "@/lib/types/live-activity-feed"

/**
 * Unified live activity stream. Uses GET /api/activity/live-feed (BFF).
 * Future: subscribe to WebSocket topic `activity:live` with same payload shape + cursor.
 */
export function useLiveActivityFeed(opts?: {
  lat?: number
  lng?: number
  limit?: number
  pollMs?: number
}) {
  const lat = opts?.lat
  const lng = opts?.lng
  const limit = opts?.limit ?? 24
  const pollMs = opts?.pollMs ?? 55_000

  const [data, setData] = useState<LiveFeedResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (silent?: boolean) => {
      if (!silent) setLoading(true)
      try {
        const next = await liveActivityFeedService.get({ lat, lng, limit })
        setData(next)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    [lat, lng, limit]
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (pollMs <= 0) return
    const id = window.setInterval(() => void load(true), pollMs)
    return () => window.clearInterval(id)
  }, [load, pollMs])

  const items: LiveFeedItem[] = data?.items ?? []

  return {
    items,
    meta: data?.meta,
    generatedAt: data?.generatedAt,
    loading,
    refresh: () => void load(),
    wsTopicHint: "activity:live" as const,
  }
}
