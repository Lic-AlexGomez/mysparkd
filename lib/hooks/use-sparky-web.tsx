"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import type { CompanionEvent } from "@/lib/companion/context-signals"
import {
  createCompanionEngineState,
  daysSinceLastOpen,
  dispatchCompanionEvent,
  moodToSparkyExpression,
  tickCompanionEngine,
  type CompanionEngineState,
} from "@/lib/companion/engine"
import { buildCompanionVibeContext, processDailyAdaptiveLearning } from "@/lib/companion/adaptive-engine"
import { lottieEnabledForExpression } from "@/lib/companion/animation-map"
import { registerCompanionApiHandlers, registerCompanionScrollFast } from "@/lib/companion/api-bridge"
import { useCompanionContextWeb } from "@/lib/hooks/use-companion-context-web"
import {
  createPresenceDirectorState,
  reducePresenceDirector,
} from "@/lib/companion/presence-director"
import { relationshipLevelFromBondPoints } from "@/lib/companion/vibe-engine"
import { pickProactiveLine, pickProactiveLineForCompanionEvent } from "@/lib/companion/proactive-line"
import { publishProactiveLine } from "@/lib/companion/publish-proactive"
import {
  loadSparkyMemory,
  loadSparkyWebSettings,
  saveSparkyMemory,
  type SparkyMemory,
} from "@/lib/sparky-memory"
import { addBondPoints, getSparkBond } from "@/lib/sparky-bond"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { CompanionId } from "@/lib/companion/catalog"

function resolvePresence(pathname: string): "full" | "subtle" | "quiet" {
  if (pathname.startsWith("/swipes") || pathname.startsWith("/chat")) return "subtle"
  return "full"
}

export function useSparkyWeb() {
  const pathname = usePathname()
  const [memory, setMemory] = useState<SparkyMemory>(() => loadSparkyMemory())
  const [engine, setEngine] = useState<CompanionEngineState>(() => createCompanionEngineState())
  const [expression, setExpression] = useState<SparkyExpression>("happy")
  const [proactiveCopy, setProactiveCopy] = useState<string | null>(null)
  const [desktopMode, setDesktopMode] = useState(false)
  const settings = useMemo(() => loadSparkyWebSettings(), [])
  const presence = useMemo(() => resolvePresence(pathname), [pathname])
  const bond = useMemo(() => getSparkBond(memory), [memory])
  const companionId = (memory.favoriteCompanion ?? "sparky") as CompanionId
  const sessionStart = useRef(Date.now())
  const lastTouchRef = useRef(Date.now())
  const presenceDirectorRef = useRef(createPresenceDirectorState())
  const moodHydratedRef = useRef(false)

  const dispatchCompanion = useCallback(
    (event: CompanionEvent, opts?: { force?: boolean }) => {
      setEngine((prev) => {
        const result = dispatchCompanionEvent(prev, event, { force: opts?.force })
        setExpression(result.expression)
        return result.state
      })
    },
    []
  )

  const handleCompanionEvent = useCallback(
    (event: CompanionEvent, opts?: { force?: boolean; proactive?: boolean }) => {
      dispatchCompanion(event, { force: opts?.force })
      if (!opts?.proactive || presence === "subtle" || settings.sparkyMode === "quiet") return
      setMemory((prev) => {
        const now = new Date()
        const relationshipLevel = relationshipLevelFromBondPoints(prev.bondPoints ?? 0)
        const picked = pickProactiveLineForCompanionEvent({
          memory: prev,
          relationshipLevel,
          event,
          now,
          daysSinceOpen: daysSinceLastOpen(prev.lastOpenDay) ?? undefined,
        })
        if (!picked) return prev
        const result = publishProactiveLine(prev, {
          line: picked.line,
          key: picked.key,
          relationshipLevel,
          now,
          cooldownMs: 90_000,
        })
        if (result.allowed) {
          saveSparkyMemory(result.memory)
          setProactiveCopy(result.line)
          return result.memory
        }
        return result.memory
      })
    },
    [dispatchCompanion, presence, settings.sparkyMode]
  )

  const companionCtx = useCompanionContextWeb({
    enabled: true,
    memory,
    presence,
    sparkyMode: settings.sparkyMode,
    onEvent: handleCompanionEvent,
    onMemoryUpdate: (m) => {
      setMemory(m)
      saveSparkyMemory(m)
    },
  })

  useEffect(() => {
    const onSynced = () => {
      moodHydratedRef.current = false
      setMemory(loadSparkyMemory())
    }
    window.addEventListener("sparkd-sparky-memory-synced", onSynced)
    return () => window.removeEventListener("sparkd-sparky-memory-synced", onSynced)
  }, [])

  useEffect(() => {
    const unregApi = registerCompanionApiHandlers({
      onLoadingStart: companionCtx.notifyLoadingStart,
      onLoadingEnd: companionCtx.notifyLoadingEnd,
      onError: companionCtx.notifyError,
      onSuccess: companionCtx.notifySuccess,
    })
    const unregScroll = registerCompanionScrollFast(companionCtx.notifyScrollFast)
    return () => {
      unregApi()
      unregScroll()
    }
  }, [companionCtx])

  useEffect(() => {
    const interval = setInterval(() => {
      setEngine((prev) => {
        const next = tickCompanionEngine(prev)
        if (next.mood !== prev.mood) {
          setExpression(next.mood === "idle" ? "idle" : moodToSparkyExpression(next.mood))
        }
        return next
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (moodHydratedRef.current) return
    const mood = memory.currentMood
    const expiresAt = memory.moodExpiresAt ? Date.parse(memory.moodExpiresAt) : 0
    if (!mood || Number.isNaN(expiresAt) || expiresAt <= Date.now()) return
    moodHydratedRef.current = true
    const intensity = Math.max(0.2, Math.min(1, 1 - (memory.fatigueLevel ?? 0) * 0.35))
    setEngine((prev) => {
      if (
        prev.mood === mood &&
        prev.expiresAt === expiresAt &&
        Math.abs(prev.intensity - intensity) < 0.001
      ) {
        return prev
      }
      return {
        ...prev,
        mood: mood as CompanionEngineState["mood"],
        expiresAt,
        intensity,
      }
    })
    setExpression(moodToSparkyExpression(mood as CompanionEngineState["mood"]))
  }, [memory.currentMood, memory.moodExpiresAt, memory.fatigueLevel])

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      const reduced = reducePresenceDirector(presenceDirectorRef.current, {
        now: now.getTime(),
        idleMs: now.getTime() - lastTouchRef.current,
        openPanel: false,
      })
      presenceDirectorRef.current = reduced.state
      const presenceEvent = reduced.event
      if (!presenceEvent || presenceEvent === "idle_breath_glow") return

      if (presence === "subtle" || settings.sparkyMode === "quiet") return

      setMemory((prev) => {
        const relationshipLevel = relationshipLevelFromBondPoints(prev.bondPoints ?? 0)
        const picked = pickProactiveLine({
          memory: prev,
          relationshipLevel,
          event: presenceEvent,
          now,
        })
        if (!picked) return prev
        const result = publishProactiveLine(prev, {
          line: picked.line,
          key: picked.key,
          relationshipLevel,
          now,
          cooldownMs: presenceEvent === "peek_from_edge" ? 45_000 : 60_000,
        })
        if (result.allowed) {
          saveSparkyMemory(result.memory)
          setProactiveCopy(result.line)
          return result.memory
        }
        return result.memory
      })

      if (presenceEvent === "peek_from_edge") {
        dispatchCompanion("scroll_fast", { force: false })
      } else if (presenceEvent === "curious_scan") {
        dispatchCompanion("new_message", { force: false })
      }
    }, 8000)
    return () => clearInterval(id)
  }, [dispatchCompanion, presence, settings.sparkyMode])

  useEffect(() => {
    setMemory((prev) => {
      const mins = Math.round((Date.now() - sessionStart.current) / 60000)
      let next = processDailyAdaptiveLearning(prev, {
        sessionMinutes: mins,
        positiveInteraction: true,
      })
      if (next !== prev) saveSparkyMemory(next)
      return next
    })
  }, [])

  useEffect(() => {
    const persistedMood = memory.currentMood
    const persistedExpires = memory.moodExpiresAt ? Date.parse(memory.moodExpiresAt) : 0
    const hasPersistedMood = Boolean(
      persistedMood && !Number.isNaN(persistedExpires) && persistedExpires > Date.now()
    )
    if (hasPersistedMood && !moodHydratedRef.current) return

    const moodExpiresAt =
      engine.expiresAt > 0 ? new Date(engine.expiresAt).toISOString() : undefined
    const fatigueLevel = Math.min(1, Math.max(0, 1 - engine.intensity))

    setMemory((prev) => {
      const moodUnchanged = prev.currentMood === engine.mood
      const expiresUnchanged = prev.moodExpiresAt === moodExpiresAt
      const fatigueUnchanged = Math.abs((prev.fatigueLevel ?? 0) - fatigueLevel) < 0.05
      if (moodUnchanged && expiresUnchanged && fatigueUnchanged) return prev

      const next = {
        ...prev,
        currentMood: engine.mood,
        moodSince: moodUnchanged ? prev.moodSince : new Date().toISOString(),
        moodExpiresAt,
        fatigueLevel,
      }
      saveSparkyMemory(next)
      return next
    })
  }, [engine.mood, engine.expiresAt, engine.intensity, memory.currentMood, memory.moodExpiresAt])

  const vibeContext = useMemo(() => buildCompanionVibeContext(memory), [memory])

  const companionLottieEnabled = lottieEnabledForExpression(expression)

  const recordTouch = useCallback(() => {
    lastTouchRef.current = Date.now()
    setMemory((prev) => {
      const next = addBondPoints(prev, 1)
      saveSparkyMemory(next)
      return next
    })
    companionCtx.touchActivity()
  }, [companionCtx])

  const selectCompanion = useCallback((id: CompanionId) => {
    setMemory((prev) => {
      const next = { ...prev, favoriteCompanion: id }
      saveSparkyMemory(next)
      return next
    })
  }, [])

  const clearProactiveCopy = useCallback(() => setProactiveCopy(null), [])

  return {
    pathname,
    memory,
    engine,
    expression,
    proactiveCopy,
    clearProactiveCopy,
    companionId,
    bond,
    vibeContext,
    desktopMode,
    setDesktopMode,
    companionLottieEnabled,
    dispatchCompanion,
    recordTouch,
    selectCompanion,
    companionCtx,
    settings,
    presence,
  }
}
