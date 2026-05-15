"use client"

import { useCallback, useEffect, useState } from "react"
import { activityCoreStreamService } from "@/lib/services/activity-core-stream"
import type { ActivityCoreExperienceMode, ActivityCoreStreamResponse } from "@/lib/types/activity-core-stream"

export function useActivityCoreStream(opts: {
  lat?: number
  lng?: number
  city?: string
  limit?: number
  mode?: ActivityCoreExperienceMode
  enabled?: boolean
  refreshMs?: number
}) {
  const enabled = opts.enabled !== false
  const [data, setData] = useState<ActivityCoreStreamResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const res = await activityCoreStreamService.get({
        lat: opts.lat,
        lng: opts.lng,
        city: opts.city,
        limit: opts.limit,
        mode: opts.mode,
      })
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "core-stream failed")
    } finally {
      setLoading(false)
    }
  }, [enabled, opts.lat, opts.lng, opts.city, opts.limit, opts.mode])

  useEffect(() => {
    if (!enabled) return
    void refresh()
    const ms = opts.refreshMs
    if (ms && ms > 0) {
      const t = window.setInterval(() => void refresh(), ms)
      return () => window.clearInterval(t)
    }
    return undefined
  }, [enabled, refresh, opts.refreshMs])

  return { data, loading, error, refresh }
}
