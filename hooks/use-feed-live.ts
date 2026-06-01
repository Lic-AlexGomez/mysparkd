"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchFeedLive } from "@/lib/services/feed-live"
import type { FeedLiveResponse } from "@/lib/types/feed-live"

export function useFeedLive(opts: {
  lat?: number
  lng?: number
  limit?: number
  enabled?: boolean
  refreshMs?: number
}) {
  const enabled = opts.enabled !== false
  const refreshMs = opts.refreshMs ?? 90_000
  const [data, setData] = useState<FeedLiveResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (silent?: boolean) => {
      if (!enabled) {
        setLoading(false)
        return
      }
      if (!silent) setLoading(true)
      try {
        const next = await fetchFeedLive({
          lat: opts.lat,
          lng: opts.lng,
          limit: opts.limit ?? 24,
        })
        setData(next)
      } finally {
        setLoading(false)
      }
    },
    [enabled, opts.lat, opts.lng, opts.limit]
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!enabled || refreshMs <= 0) return
    const id = window.setInterval(() => void load(true), refreshMs)
    return () => window.clearInterval(id)
  }, [enabled, refreshMs, load])

  return { data, loading, refresh: () => void load(true) }
}
