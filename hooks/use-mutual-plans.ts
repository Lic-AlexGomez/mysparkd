"use client"

import { useCallback, useEffect, useState } from "react"
import {
  fetchMutualPlansForEvent,
  fetchMutualPlansForUser,
} from "@/lib/services/mutual-plans"
import type { MutualPlansEventBundle, MutualPlansUserBundle } from "@/lib/types/mutual-plans"

export function useMutualPlansUser(userId: string | undefined, pollMs = 90_000) {
  const [data, setData] = useState<MutualPlansUserBundle | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (silent?: boolean) => {
      if (!userId) {
        setData(null)
        setLoading(false)
        return
      }
      if (!silent) setLoading(true)
      try {
        const bundle = await fetchMutualPlansForUser(userId)
        setData(bundle)
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!userId || pollMs <= 0) return
    const id = window.setInterval(() => void load(true), pollMs)
    return () => window.clearInterval(id)
  }, [load, userId, pollMs])

  const total =
    (data?.goingWithYou.length ?? 0) +
    (data?.matchesHere.length ?? 0) +
    (data?.friendsInterested.length ?? 0) +
    (data?.sharedPlansNearYou.length ?? 0)

  return { data, loading, refresh: () => void load(), total }
}

export function useMutualPlansEvent(eventId: string | undefined, pollMs = 90_000) {
  const [data, setData] = useState<MutualPlansEventBundle | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (silent?: boolean) => {
      if (!eventId) {
        setData(null)
        setLoading(false)
        return
      }
      if (!silent) setLoading(true)
      try {
        const bundle = await fetchMutualPlansForEvent(eventId)
        setData(bundle)
      } finally {
        setLoading(false)
      }
    },
    [eventId]
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!eventId || pollMs <= 0) return
    const id = window.setInterval(() => void load(true), pollMs)
    return () => window.clearInterval(id)
  }, [load, eventId, pollMs])

  const total =
    (data?.goingWithYou.length ?? 0) +
    (data?.matchesHere.length ?? 0) +
    (data?.friendsInterested.length ?? 0)

  return { data, loading, refresh: () => void load(), total }
}
