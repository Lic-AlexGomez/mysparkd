"use client"

import { useCallback, useEffect, useState } from "react"
import {
  resolveAttentionTarget,
  type AttentionSource,
  type AttentionTarget,
} from "@/lib/companion/attention-system"

export type SparkyGaze = { x: number; y: number }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** Ojos siguen cursor + deambulan; `lookAt` para hover en botones. */
export function useSparkyGazeWeb(enabled: boolean): SparkyGaze & { lookAt: (x: number, y: number) => void } {
  const [gaze, setGaze] = useState<SparkyGaze>({ x: 0, y: 0 })
  const [manualUntil, setManualUntil] = useState(0)
  const [targets, setTargets] = useState<AttentionTarget[]>([])

  const lookAt = useCallback((x: number, y: number) => {
    const next = { source: "touch" as const, x: clamp(x, -1, 1), y: clamp(y, -1, 1), at: Date.now() }
    setTargets((prev) => [...prev.filter((t) => t.source !== "touch"), next])
    setManualUntil(Date.now() + 1200)
  }, [])

  const focusAttention = useCallback((source: AttentionSource, x: number, y: number) => {
    const next = { source, x: clamp(x, -1, 1), y: clamp(y, -1, 1), at: Date.now() }
    setTargets((prev) => [...prev.filter((t) => t.source !== source), next])
  }, [])

  useEffect(() => {
    if (!enabled) return
    const onMove = (e: MouseEvent) => {
      if (Date.now() < manualUntil) return
      const x = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1)
      const y = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1)
      focusAttention("hover", x, y)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [enabled, manualUntil])

  useEffect(() => {
    if (!enabled) return
    let id = 0
    const wander = () => {
      if (Date.now() < manualUntil) {
        id = window.setTimeout(wander, 800)
        return
      }
      focusAttention(
        "wander",
        clamp((Math.random() - 0.5) * 1.2, -1, 1),
        clamp((Math.random() - 0.5) * 0.8, -1, 1)
      )
      id = window.setTimeout(wander, 2400 + Math.random() * 2000)
    }
    id = window.setTimeout(wander, 4000)
    return () => clearTimeout(id)
  }, [enabled, manualUntil])

  useEffect(() => {
    if (!enabled) return
    const winner = resolveAttentionTarget(targets, Date.now())
    if (!winner) return
    setGaze({ x: winner.x, y: winner.y })
  }, [enabled, targets])

  return { ...gaze, lookAt, focusAttention }
}
