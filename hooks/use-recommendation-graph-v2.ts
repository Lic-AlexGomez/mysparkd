"use client"

import { useCallback, useEffect, useState } from "react"
import { recommendationGraphV2Service } from "@/lib/services/recommendation-graph-v2"
import type { RecommendationsResponse } from "@/lib/types/recommendation-graph-v2"

export function useRecommendationGraphV2(userId: string | undefined, opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled !== false && Boolean(userId?.trim())
  const [data, setData] = useState<RecommendationsResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!enabled || !userId?.trim()) return
    setLoading(true)
    try {
      const next = await recommendationGraphV2Service.getForUser(userId.trim())
      setData(next)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, userId])

  useEffect(() => {
    void load()
  }, [load])

  return { bundle: data, loading, refresh: () => void load() }
}
