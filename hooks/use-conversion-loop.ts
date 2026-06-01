"use client"

import { useCallback, useEffect, useState } from "react"
import { conversionLoopService } from "@/lib/services/conversion-loop"
import type { LoopInsightsResponse } from "@/lib/types/conversion-loop"

export function useConversionLoop(
  userId: string | undefined,
  opts?: { enabled?: boolean; refreshMs?: number }
) {
  const enabled = Boolean(userId) && (opts?.enabled !== false)
  const [insights, setInsights] = useState<LoopInsightsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const ins = await conversionLoopService.getInsights(userId)
      setInsights(ins)
    } catch (e) {
      setError(e instanceof Error ? e.message : "loop failed")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!enabled || !userId) return
    void refresh()
    const ms = opts?.refreshMs
    if (ms && ms > 0) {
      const t = window.setInterval(() => void refresh(), ms)
      return () => window.clearInterval(t)
    }
    return undefined
  }, [enabled, userId, refresh, opts?.refreshMs])

  const actions = insights?.suggested_actions ?? []

  return { insights, actions, loading, error, refresh }
}
