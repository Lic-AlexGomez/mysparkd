"use client"

import { useCallback, useRef, useState } from "react"

const MIN_UI_GAP_MS = 14_000

/** Limita cuántas frases proactivas distintas ve el usuario por minuto. */
export function useThrottledProactiveCopy() {
  const [copy, setCopy] = useState<string | null>(null)
  const lastShownAt = useRef(0)
  const pendingRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushPending = useCallback(() => {
    if (!pendingRef.current) return
    setCopy(pendingRef.current)
    pendingRef.current = null
    lastShownAt.current = Date.now()
    timerRef.current = null
  }, [])

  const show = useCallback(
    (line: string) => {
      const trimmed = line.trim()
      if (!trimmed) return

      const now = Date.now()
      if (lastShownAt.current === 0 || now - lastShownAt.current >= MIN_UI_GAP_MS) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        pendingRef.current = null
        setCopy(trimmed)
        lastShownAt.current = now
        return
      }

      pendingRef.current = trimmed
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flushPending, MIN_UI_GAP_MS - (now - lastShownAt.current))
    },
    [flushPending]
  )

  const clear = useCallback(() => {
    pendingRef.current = null
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setCopy(null)
    lastShownAt.current = 0
  }, [])

  return { copy, show, clear }
}
