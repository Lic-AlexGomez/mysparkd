"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { HelpAssistantSettings, HelpRouteKey } from "@/lib/help-assistant"
import { routeToContextAnchor } from "@/lib/sparky-anchors"
import type { SparkyAnchor } from "@/lib/sparky-motion"
import {
  anchorToPosition,
  buildRoamWaypoints,
  clampPosition,
  facingFromMove,
  type SparkyAnimMode,
  type SparkyFacing,
  type SparkyScreenPosition,
} from "@/lib/sparky-web-presence"
import { getEngagementTier, getSparkyPresenceLevel } from "@/lib/sparky-engagement"
import { pickIdleLifeAction } from "@/lib/sparky-life"
import type { SparkyMemory } from "@/lib/sparky-memory"

type Options = {
  settings: HelpAssistantSettings
  routeKey: HelpRouteKey | null
  memory: SparkyMemory
  enabled: boolean
  paused: boolean
  pathname: string
  onMicroMessage?: (text: string) => void
}

export function useSparkyPresence({
  settings,
  routeKey,
  memory,
  enabled,
  paused,
  pathname,
  onMicroMessage,
}: Options) {
  const [position, setPosition] = useState<SparkyScreenPosition>(() => anchorToPosition("bottomRight"))
  const [facing, setFacing] = useState<SparkyFacing>("center")
  const [animMode, setAnimMode] = useState<SparkyAnimMode>("float")
  const [blinking, setBlinking] = useState(false)
  const [winking, setWinking] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const roamIndex = useRef(0)
  const waypoints = useRef<SparkyScreenPosition[]>([])
  const lastRoute = useRef<string | null>(null)

  const presence = getSparkyPresenceLevel(settings, pathname, routeKey)
  const engagement = getEngagementTier(memory)
  const lifeEnabled =
    enabled &&
    !paused &&
    settings.sparkyMode !== "quiet" &&
    (settings.sparkyLife?.allowIdleAnimations ?? true)

  const moveTo = useCallback((target: SparkyScreenPosition, mode: SparkyAnimMode = "walk") => {
    if (typeof window === "undefined") return
    setPosition((prev) => {
      const next = clampPosition(target, window.innerWidth, window.innerHeight)
      const face = facingFromMove(prev, next)
      queueMicrotask(() => setFacing(face))
      return next
    })
    setAnimMode(mode)
    window.setTimeout(() => setAnimMode("float"), mode === "walk" ? 700 : 400)
  }, [])

  const moveToAnchor = useCallback(
    (anchor: SparkyAnchor) => {
      moveTo(anchorToPosition(anchor), "walk")
    },
    [moveTo]
  )

  const returnHome = useCallback(() => {
    moveTo(anchorToPosition("bottomRight"), "walk")
  }, [moveTo])

  const bounce = useCallback(() => {
    setAnimMode("bounce")
    setTimeout(() => setAnimMode("float"), 500)
  }, [])

  const wink = useCallback(() => {
    setWinking(true)
    setTimeout(() => setWinking(false), 700)
  }, [])

  const celebrate = useCallback(() => {
    setAnimMode("celebrate")
    setTimeout(() => setAnimMode("float"), 1200)
  }, [])

  const think = useCallback(() => {
    setAnimMode("think")
  }, [])

  const wake = useCallback(() => {
    setAnimMode((m) => (m === "sleep" ? "float" : m))
    bounce()
  }, [bounce])

  const blinkOnce = useCallback(() => {
    setBlinking(true)
    setTimeout(() => setBlinking(false), 120)
  }, [])

  const dragTo = useCallback((pos: SparkyScreenPosition) => {
    if (typeof window === "undefined") return
    setPosition(clampPosition(pos, window.innerWidth, window.innerHeight))
    setAnimMode("float")
  }, [])

  useEffect(() => {
    const anchor = routeToContextAnchor(routeKey)
    waypoints.current = buildRoamWaypoints(anchor)
    roamIndex.current = 0
    if (lastRoute.current !== pathname && !paused) {
      lastRoute.current = pathname
      const t = setTimeout(() => moveToAnchor(anchor), 1200)
      return () => clearTimeout(t)
    }
  }, [pathname, routeKey, moveToAnchor, paused])

  useEffect(() => {
    if (!lifeEnabled || isDragging) return

    const blinkIv = setInterval(() => {
      if (Math.random() > 0.35) blinkOnce()
    }, 3200 + Math.random() * 2000)

    return () => clearInterval(blinkIv)
  }, [lifeEnabled, isDragging, blinkOnce])

  useEffect(() => {
    if (!lifeEnabled || isDragging || presence === "hidden") return

    const intervalMs =
      settings.sparkyMode === "coach"
        ? 9000
        : settings.sparkyMode === "companion"
          ? 14000
          : 22000

    const tick = () => {
      if (presence === "subtle" && Math.random() > 0.45) return

      const action = pickIdleLifeAction(settings, routeKey, Date.now(), {
        presence,
        engagementTier: engagement,
      })

      if (action?.type === "wink") {
        wink()
        return
      }
      if (action?.type === "bounce") {
        bounce()
        return
      }
      if (action?.type === "sleep") {
        setAnimMode("sleep")
        setTimeout(() => setAnimMode("float"), 4000)
        return
      }
      if (action?.type === "wake") {
        wake()
        return
      }
      if (action?.type === "peek") {
        moveTo(anchorToPosition("edgePeekLeft"), "walk")
        return
      }
      if (action?.type === "message" && action.text) {
        onMicroMessage?.(action.text)
        bounce()
        return
      }

      const points = waypoints.current
      if (points.length < 2) return
      roamIndex.current = (roamIndex.current + 1) % points.length
      const next = points[roamIndex.current]
      moveTo(next, "walk")

      if (Math.random() < 0.12 && settings.sparkyMode === "coach") {
        setFacing(Math.random() > 0.5 ? "left" : "right")
        setTimeout(() => setFacing("center"), 800)
      }
    }

    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [
    lifeEnabled,
    isDragging,
    presence,
    engagement,
    settings,
    routeKey,
    moveTo,
    wink,
    bounce,
    wake,
    onMicroMessage,
  ])

  useEffect(() => {
    const onResize = () => {
      setPosition((p) =>
        typeof window !== "undefined"
          ? clampPosition(p, window.innerWidth, window.innerHeight)
          : p
      )
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return {
    position,
    facing,
    animMode,
    blinking,
    winking,
    isDragging,
    setIsDragging,
    moveTo,
    moveToAnchor,
    returnHome,
    bounce,
    wink,
    celebrate,
    think,
    wake,
    dragTo,
  }
}
