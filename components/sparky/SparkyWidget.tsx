"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { SparkyCharacterWeb } from "@/components/sparky/SparkyCharacterWeb"
import { SparkyHomePanel } from "@/components/sparky/SparkyHomePanel"
import { SparkyStageWeb } from "@/components/sparky/SparkyStageWeb"
import { useSparkyWeb } from "@/lib/hooks/use-sparky-web"
import { useSparkyGazeWeb } from "@/lib/hooks/use-sparky-gaze-web"
import { useSparkyExpressionTransitionWeb } from "@/lib/hooks/use-sparky-expression-transition-web"
import { installSparkyFetchInterceptor } from "@/lib/sparky-fetch"
import { companionNotifyScrollFast } from "@/lib/companion/api-bridge"
import { pickAliveLine } from "@/lib/sparky-alive-copy"
import { useStableSparkyLine } from "@/lib/sparky-line-pacing"
import { SparkyProactiveThoughtBubble } from "@/components/sparky/SparkyProactiveThoughtBubble"
import { moodToSparkyExpression } from "@/lib/companion/engine"
import { cn } from "@/lib/utils"
import { postSparkyAi } from "@/lib/sparky-ai-api"

function resolveRouteKey(pathname: string): string {
  if (pathname.startsWith("/feed")) return "feed"
  if (pathname.startsWith("/events")) return "events"
  if (pathname.startsWith("/swipes")) return "discover"
  if (pathname.startsWith("/profile")) return "profile"
  if (pathname.startsWith("/chat")) return "chat"
  return "unknown"
}

export function SparkyWidget() {
  const sparky = useSparkyWeb()
  const gazeApi = useSparkyGazeWeb(true)
  const [open, setOpen] = useState(false)
  const [whisperOpen, setWhisperOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [lastReply, setLastReply] = useState<string | null>(null)
  const [fabHover, setFabHover] = useState(false)
  const [peekState, setPeekState] = useState<"hidden" | "peeking" | "active">("active")
  const rageCount = useRef(0)
  const rageStart = useRef(0)
  const lastTouchMs = useRef(Date.now())
  const routeKey = useMemo(() => resolveRouteKey(sparky.pathname), [sparky.pathname])
  const avoidBottomRightChrome = routeKey === "events" || routeKey === "feed"

  const rawExpression = loading ? "thinking" : fabHover ? "happy" : sparky.expression
  const displayExpression = useSparkyExpressionTransitionWeb(rawExpression)

  const reduceMotion = useReducedMotion()

  const peekX = useMemo(() => {
    const sign = avoidBottomRightChrome ? -1 : 1
    if (peekState === "hidden") return sign * 42
    if (peekState === "peeking") return sign * 20
    return 0
  }, [avoidBottomRightChrome, peekState])

  const effectiveGaze = useMemo(
    () => (loading || displayExpression === "thinking" ? { x: 0, y: -0.65 } : gazeApi),
    [loading, displayExpression, gazeApi]
  )

  useEffect(() => {
    installSparkyFetchInterceptor()
  }, [])

  useEffect(() => {
    if (!sparky.pathname.startsWith("/feed")) return
    let lastY = 0
    let lastT = Date.now()
    const onScroll = () => {
      const y = window.scrollY
      const t = Date.now()
      const v = Math.abs(y - lastY) / Math.max(1, t - lastT)
      lastY = y
      lastT = t
      if (v > 2.2) companionNotifyScrollFast()
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [sparky.pathname])

  useEffect(() => {
    const tick = setInterval(() => {
      const idle = Date.now() - lastTouchMs.current
      if (!open) {
        if (idle > 75_000) setPeekState("hidden")
        else if (idle > 22_000) setPeekState("peeking")
        else setPeekState("active")
      }
      if (idle >= 180_000) {
        sparky.dispatchCompanion("user_idle", { force: true })
      }
    }, 8000)
    return () => clearInterval(tick)
  }, [open, sparky])

  const wardrobe =
    sparky.memory.wardrobeUnlocked?.includes("wardrobe_crown")
      ? "wardrobe_crown"
      : sparky.memory.wardrobeUnlocked?.includes("wardrobe_hat")
        ? "wardrobe_hat"
        : null

  const moodKey =
    sparky.engine.mood === "idle" ? "idle" : moodToSparkyExpression(sparky.engine.mood)
  const homeLine = useStableSparkyLine(
    lastReply ?? sparky.proactiveCopy ?? null,
    pickAliveLine(moodKey)
  )

  const touch = () => {
    lastTouchMs.current = Date.now()
    setPeekState("active")
    sparky.recordTouch()
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    touch()
    setInput("")
    setLoading(true)
    sparky.dispatchCompanion("loading_slow", { force: true })
    try {
      const data = await postSparkyAi({
        tier: "auto",
        task: "free_chat",
        userMessage: text,
        sparkyContext: { pathname: sparky.pathname, routeKey, ...sparky.vibeContext },
      })
      const suggestion = Array.isArray(data.suggestions) && data.suggestions.length
        ? data.suggestions[0]
        : data.error
          ? "uff..."
          : "mmm..."
      setLastReply(suggestion)
      sparky.dispatchCompanion(
        Array.isArray(data.suggestions) && data.suggestions.length ? "success" : "error",
        { force: true }
      )
    } catch {
      setLastReply("sin senal...")
      sparky.dispatchCompanion("error", { force: true })
    } finally {
      setLoading(false)
    }
  }

  const onFabClick = () => {
    touch()
    const now = Date.now()
    if (now - rageStart.current > 600) {
      rageStart.current = now
      rageCount.current = 1
    } else {
      rageCount.current += 1
    }
    if (rageCount.current >= 4) {
      rageCount.current = 0
      sparky.companionCtx.notifyRageClick()
    }
    setOpen(true)
    setWhisperOpen(false)
  }

  const shareQuote = lastReply ?? homeLine

  const shareCard = async () => {
    const text = `Sparky: "${shareQuote.slice(0, 200)}" - Sparkd`
    if (navigator.share) {
      await navigator.share({ title: "Sparky", text })
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <>
      <SparkyStageWeb
        enabled={sparky.desktopMode}
        expression={displayExpression}
        companionId={sparky.companionId}
      />

      {sparky.proactiveCopy && !open ? (
        <SparkyProactiveThoughtBubble
          message={sparky.proactiveCopy}
          onDismiss={sparky.clearProactiveCopy}
          tailSide={avoidBottomRightChrome ? "left" : "right"}
          className={avoidBottomRightChrome ? "bottom-52 left-5" : "bottom-32 right-5"}
        />
      ) : null}

      <motion.button
        type="button"
        className={cn(
          "fixed z-[60] flex h-20 w-20 items-center justify-center bg-transparent shadow-none",
          avoidBottomRightChrome ? "bottom-24 left-5" : "bottom-5 right-5"
        )}
        onClick={onFabClick}
        onMouseEnter={() => {
          setFabHover(true)
          touch()
          gazeApi.focusAttention("hover", 0.8, 0.8)
        }}
        onMouseLeave={() => setFabHover(false)}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
          const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
          gazeApi.focusAttention("hover", nx, ny)
        }}
        aria-label="Sparky"
        animate={{
          x: peekX,
          opacity: peekState === "hidden" ? 0.82 : 1,
        }}
        transition={{
          x: { type: "spring", stiffness: 110, damping: 16 },
          opacity: { duration: 0.35 },
        }}
        whileTap={{ scale: 0.94 }}
      >
        <span className="absolute inset-1 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.34),rgba(232,121,249,0.18)_45%,transparent_72%)] blur-xl" aria-hidden />
        <motion.div
          className="relative flex items-center justify-center"
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -4, -1.5, -4, 0],
                  rotate: [-2.5, 2, -1.5, 2.5, -2.5],
                  scale: fabHover ? [1.04, 1.08, 1.05, 1.08, 1.04] : [1, 1.035, 1.018, 1.035, 1],
                }
          }
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <SparkyCharacterWeb
            expression={displayExpression}
            companionId={sparky.companionId}
            avatarStyle={sparky.avatarStyle}
            size={66}
            gaze={effectiveGaze}
          />
        </motion.div>
      </motion.button>

      <SparkyHomePanel
        open={open}
        onClose={() => {
          setOpen(false)
          setWhisperOpen(false)
          setInput("")
        }}
        bondPoints={sparky.bond.points}
        expression={displayExpression}
        companionId={sparky.companionId}
        avatarStyle={sparky.avatarStyle}
        wardrobeAccessory={wardrobe}
        line={homeLine}
        gaze={effectiveGaze}
        lookAt={gazeApi.lookAt}
        whisperOpen={whisperOpen}
        onToggleWhisper={() => setWhisperOpen((v) => !v)}
        whisperValue={input}
        onWhisperChange={setInput}
        onWhisperSubmit={() => void send()}
        whisperLoading={loading}
        whisperReply={lastReply}
        onShare={() => void shareCard()}
      />
    </>
  )
}
