"use client"

import { useCallback, useEffect, useState } from "react"
import { cityPulseService } from "@/lib/services/city-pulse"
import type { CityPulseResponse } from "@/lib/types/city-pulse"

export function useCityPulse(opts?: {
  city?: string
  lat?: number
  lng?: number
  pollMs?: number
  enabled?: boolean
}) {
  const enabled = opts?.enabled !== false
  const pollMs = opts?.pollMs ?? 120_000
  const [data, setData] = useState<CityPulseResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!enabled) return
    const city = opts?.city?.trim()
    const lat = opts?.lat
    const lng = opts?.lng
    if (!city && (lat == null || lng == null)) return

    setLoading(true)
    try {
      const next = await cityPulseService.get({
        city: city || undefined,
        lat,
        lng,
      })
      setData(next)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, opts?.city, opts?.lat, opts?.lng])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!enabled || pollMs <= 0) return
    const id = window.setInterval(() => void load(), pollMs)
    return () => window.clearInterval(id)
  }, [enabled, load, pollMs])

  return {
    pulse: data,
    loading,
    refresh: () => void load(),
    isAlive: (data?.activity_score ?? 0) >= 42,
  }
}
