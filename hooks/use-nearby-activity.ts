"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchNearbyActivityBundle } from "@/lib/services/nearby-activity"
import type { NearbyActivityPulse } from "@/lib/types/nearby-activity"

/** Rotating client sparks — honest CTAs when API has no rows (never “fake users”). */
function placeholderPulses(t: (key: string) => string): NearbyActivityPulse[] {
  return [
    {
      id: "spark-events",
      kind: "new_event",
      title: t("nearbyActivity.spark.eventsTitle"),
      subtitle: t("nearbyActivity.spark.eventsSub"),
      href: "/events",
      isPlaceholder: true,
      engagementScore: 1,
    },
    {
      id: "spark-tonight",
      kind: "trending_plan",
      title: t("nearbyActivity.spark.tonightTitle"),
      subtitle: t("nearbyActivity.spark.tonightSub"),
      href: "/tonight",
      isPlaceholder: true,
      engagementScore: 1,
    },
    {
      id: "spark-groups",
      kind: "forming_group",
      title: t("nearbyActivity.spark.groupsTitle"),
      subtitle: t("nearbyActivity.spark.groupsSub"),
      href: "/groups",
      isPlaceholder: true,
      engagementScore: 1,
    },
    {
      id: "spark-feed",
      kind: "live_user",
      title: t("nearbyActivity.spark.feedTitle"),
      subtitle: t("nearbyActivity.spark.feedSub"),
      href: "/feed",
      isPlaceholder: true,
      engagementScore: 1,
    },
  ]
}

export function useNearbyActivity(opts?: {
  lat?: number
  lng?: number
  pollMs?: number
  /** i18n helper */
  t: (key: string) => string
}) {
  const lat = opts?.lat
  const lng = opts?.lng
  const pollMs = opts?.pollMs ?? 50_000
  const t = opts?.t ?? ((k: string) => k)

  const [live, setLive] = useState<NearbyActivityPulse[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (silent?: boolean) => {
      if (!silent) setLoading(true)
      try {
        const rows = await fetchNearbyActivityBundle(lat, lng)
        setLive(rows)
      } finally {
        setLoading(false)
      }
    },
    [lat, lng]
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (pollMs <= 0) return
    const id = window.setInterval(() => void load(true), pollMs)
    return () => window.clearInterval(id)
  }, [load, pollMs])

  /** Product rule: strip is never empty — merge API + placeholders (dedupe by id). */
  const pulses = useMemo(() => {
    const sparks = placeholderPulses(t)
    if (live.length === 0) return sparks
    const ids = new Set(live.map((p) => p.id))
    const fill = sparks.filter((s) => !ids.has(s.id))
    const merged = [...live, ...fill]
    return merged.slice(0, 14)
  }, [live, t])

  return {
    pulses,
    loading,
    refresh: () => void load(),
    /** Reserved for WebSocket: subscribe to same channels backend exposes */
    wsReady: true,
  }
}
