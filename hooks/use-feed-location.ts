"use client"

import { useCallback, useEffect, useState } from "react"
import {
  effectiveFeedCoords,
  feedLocationService,
  type FeedLocationResponse,
} from "@/lib/services/feed-location"

export function useFeedLocation() {
  const [data, setData] = useState<FeedLocationResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await feedLocationService.get())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const coords = effectiveFeedCoords(data)

  return {
    data,
    loading,
    refresh,
    effectiveLat: coords.lat,
    effectiveLng: coords.lng,
    fromVirtual: coords.fromVirtual,
    hasVirtualLocation: Boolean(data?.hasVirtualLocation),
    hasRealLocation: data?.latitude != null && data?.longitude != null,
    hasAnyLocation: coords.lat != null && coords.lng != null,
    saveRealLocation: async (latitude: number, longitude: number) => {
      await feedLocationService.saveReal({ latitude, longitude })
      await refresh()
    },
    setVirtualLocation: async (latitude: number, longitude: number) => {
      await feedLocationService.setVirtual({ latitude, longitude })
      await refresh()
    },
    clearVirtualLocation: async () => {
      await feedLocationService.clearVirtual()
      await refresh()
    },
    requestBrowserAndSave: feedLocationService.requestBrowserAndSave,
    requestBrowser: feedLocationService.requestBrowser,
  }
}
