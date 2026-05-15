"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  fetchTonightActiveUsers,
  fetchTonightEvents,
  fetchTonightGroups,
  fetchTonightPlans,
  fetchTonightStream,
} from "@/lib/services/tonight"
import type {
  TonightActiveUserItem,
  TonightEventItem,
  TonightGroupItem,
  TonightPlanItem,
} from "@/lib/types/tonight"

export type TonightBundle = {
  events: TonightEventItem[]
  activeUsers: TonightActiveUserItem[]
  groups: TonightGroupItem[]
  plans: TonightPlanItem[]
}

export function useTonight(opts?: { lat?: number; lng?: number; pollMs?: number }) {
  const lat = opts?.lat
  const lng = opts?.lng
  const pollMs = opts?.pollMs ?? 60_000

  const [data, setData] = useState<TonightBundle>({
    events: [],
    activeUsers: [],
    groups: [],
    plans: [],
  })
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true)
      try {
        const stream = await fetchTonightStream(lat, lng)
      if (stream && stream.events && stream.events.length > 0) {
        console.log("[useTonight] Using stream, events count:", stream.events.length)
        // Dedup by ID (some events may come from both catalog and Sparkd backend)
        const seen = new Set<string>()
        const dedupedEvents = stream.events.filter(e => {
          const key = String(e.id)
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })
        if (dedupedEvents.length !== stream.events.length) {
          console.log("[useTonight] Dedup removed", stream.events.length - dedupedEvents.length, "duplicates")
        }
        setData({
          events: dedupedEvents,
          activeUsers: stream.active_users,
          groups: stream.groups,
          plans: stream.plans,
        })
      } else {
        // Si el stream no tiene eventos, usar la API de Ezploro directamente
        const [events, activeUsers, groups, plans] = await Promise.all([
          fetchTonightEvents(lat, lng),
          fetchTonightActiveUsers(lat, lng),
          fetchTonightGroups(lat, lng),
          fetchTonightPlans(lat, lng),
        ])
        console.log("[useTonight] Using Ezploro API directly, events count:", events?.length)
        setData({ events, activeUsers, groups, plans })
      }
        setUpdatedAt(new Date())
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
    const id = window.setInterval(() => void load({ silent: true }), pollMs)
    return () => window.clearInterval(id)
  }, [load, pollMs])

  const totalLive = useMemo(
    () =>
      data.events.length +
      data.activeUsers.length +
      data.groups.length +
      data.plans.length,
    [data]
  )

  return { ...data, loading, updatedAt, refresh: load, totalLive }
}
