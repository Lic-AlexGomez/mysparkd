"use client"

import { useCallback, useEffect, useRef } from "react"
import type { CompanionEvent } from "@/lib/companion/context-signals"
import { daysSinceLastOpen, resolveReturnEvent } from "@/lib/companion/engine"
import { shouldShowProactiveCopy } from "@/lib/companion/copy"
import type { SparkyMemory } from "@/lib/sparky-memory"
import { recordAppOpenDay } from "@/lib/sparky-memory"

const IDLE_MS = 2 * 60 * 60 * 1000
const SLOW_LOAD_MS = 4500

type WebPresence = "full" | "subtle" | "quiet"

type Options = {
  enabled: boolean
  memory: SparkyMemory
  presence: WebPresence
  sparkyMode: string
  onEvent: (event: CompanionEvent, opts?: { force?: boolean; proactive?: boolean }) => void
  onMemoryUpdate?: (memory: SparkyMemory) => void
}

export function useCompanionContextWeb({
  enabled,
  memory,
  presence,
  sparkyMode,
  onEvent,
  onMemoryUpdate,
}: Options) {
  const lastActivityRef = useRef(Date.now())
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const returnHandledRef = useRef(false)
  const openHandledRef = useRef(false)

  const emit = useCallback(
    (event: CompanionEvent, opts?: { force?: boolean; proactive?: boolean }) => {
      if (!enabled) return
      const wantsProactive =
        opts?.proactive ??
        (presence !== "subtle" &&
          shouldShowProactiveCopy(
            { enabled: true, sparkyMode: sparkyMode as "companion" },
            "bonded"
          ))
      onEvent(event, { force: opts?.force, proactive: wantsProactive })
    },
    [enabled, onEvent, presence, sparkyMode]
  )

  const touchActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!enabled || openHandledRef.current) return
    openHandledRef.current = true
    const days = daysSinceLastOpen(memory.lastOpenDay)
    const returnEv = resolveReturnEvent(days)
    if (returnEv && !returnHandledRef.current) {
      returnHandledRef.current = true
      emit(returnEv, { force: true, proactive: true })
    }
    const today = new Date().toISOString().slice(0, 10)
    if (memory.lastOpenDay !== today && onMemoryUpdate) {
      onMemoryUpdate(recordAppOpenDay(memory, today))
    }
    emit("app_open")
  }, [enabled, emit, memory.lastOpenDay, onMemoryUpdate])

  useEffect(() => {
    if (!enabled) return
    const onVis = () => {
      if (document.visibilityState === "hidden") emit("app_background")
      else {
        touchActivity()
        emit("app_open")
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [enabled, emit, touchActivity])

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_MS) emit("user_idle")
    }, 60_000)
    return () => clearInterval(id)
  }, [enabled, emit])

  const notifyLoadingStart = useCallback(() => {
    touchActivity()
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
    slowTimerRef.current = setTimeout(() => emit("loading_slow"), SLOW_LOAD_MS)
  }, [emit, touchActivity])

  const notifyLoadingEnd = useCallback(() => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current)
      slowTimerRef.current = null
    }
  }, [])

  const notifyError = useCallback(() => {
    touchActivity()
    emit("error", { force: true, proactive: true })
  }, [emit, touchActivity])

  const notifySuccess = useCallback(() => {
    touchActivity()
    emit("success", { force: true, proactive: true })
  }, [emit, touchActivity])

  const notifyRageClick = useCallback(() => {
    touchActivity()
    emit("rage_click", { force: true, proactive: true })
  }, [emit, touchActivity])

  const notifyScrollFast = useCallback(() => {
    touchActivity()
    emit("scroll_fast")
  }, [emit, touchActivity])

  return {
    touchActivity,
    notifyLoadingStart,
    notifyLoadingEnd,
    notifyError,
    notifySuccess,
    notifyRageClick,
    notifyScrollFast,
  }
}
