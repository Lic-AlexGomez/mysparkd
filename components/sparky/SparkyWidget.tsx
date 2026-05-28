"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { SparkyCharacterWeb } from "@/components/sparky/SparkyCharacterWeb"
import { SparkyHomePanel } from "@/components/sparky/SparkyHomePanel"
import { SparkyStageWeb } from "@/components/sparky/SparkyStageWeb"
import { useSparkyWeb } from "@/lib/hooks/use-sparky-web"
import { useSparkyGazeWeb } from "@/lib/hooks/use-sparky-gaze-web"
import { useSparkyExpressionTransitionWeb } from "@/lib/hooks/use-sparky-expression-transition-web"
import { installSparkyFetchInterceptor } from "@/lib/sparky-fetch"
import { companionNotifyScrollFast } from "@/lib/companion/api-bridge"
import { SPARKY_ALIVE, pickAliveLine } from "@/lib/sparky-alive-copy"
import { moodToSparkyExpression } from "@/lib/companion/engine"
import { cn } from "@/lib/utils"

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
      } else if (idle >= 90_000) {
        sparky.dispatchCompanion("user_idle", { force: false })
      } else if (idle >= 30_000 && !open) {
        sparky.dispatchCompanion("user_idle", { force: false })
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

  const homeLine =
    lastReply ??
    sparky.proactiveCopy ??
    pickAliveLine(sparky.engine.mood === "idle" ? "idle" : moodToSparkyExpression(sparky.engine.mood))

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
      const res = await fetch("/api/sparky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "auto",
          task: "free_chat",
          userMessage: text,
          sparkyContext: { pathname: sparky.pathname, routeKey, ...sparky.vibeContext },
        }),
      })
      const data = (await res.json()) as { suggestions?: string[]; error?: string }
      const suggestion = Array.isArray(data.suggestions) && data.suggestions.length
        ? data.suggestions[0]
        : data.error
          ? "uff…"
          : "mmm…"
      setLastReply(suggestion)
      sparky.dispatchCompanion(res.ok ? "success" : "error", { force: true })
    } catch {
      setLastReply("sin señal…")
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
    const text = `Sparky: "${shareQuote.slice(0, 200)}" — Sparkd`
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
        <motion.div
          className={cn(
            "fixed z-[59] max-w-[200px] rounded-2xl border border-primary/30 bg-card/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur-sm",
            avoidBottomRightChrome ? "bottom-36 left-5" : "bottom-24 right-5"
          )}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p>{sparky.proactiveCopy}</p>
          <button
            type="button"
            className="mt-1 text-xs text-muted-foreground"
            onClick={sparky.clearProactiveCopy}
          >
            ok
          </button>
        </motion.div>
      ) : null}

      <motion.button
        type="button"
        className={cn(
          "fixed z-[60] flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 shadow-xl ring-2 ring-primary/50",
          avoidBottomRightChrome ? "bottom-24 left-5" : "bottom-5 right-5"
        )}
        onClick={onFabClick}
        onMouseEnter={() => {
          setFabHover(true)
          touch()
          gazeApi.focusAttention("hover", 0.8, 0.8)
        }}
        onMouseLeave={() => setFabHover(false)}
        aria-label="Sparky"
        animate={{
          y: [0, -5, 0],
          scale: fabHover ? 1.06 : 1,
          x: avoidBottomRightChrome
            ? peekState === "hidden"
              ? -42
              : peekState === "peeking"
                ? -20
                : 0
            : peekState === "hidden"
              ? 42
              : peekState === "peeking"
                ? 20
                : 0,
          opacity: peekState === "hidden" ? 0.8 : 1,
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.92 }}
      >
        <SparkyCharacterWeb
          expression={displayExpression}
          companionId={sparky.companionId}
          wardrobeAccessory={wardrobe}
          size={52}
          gaze={effectiveGaze}
        />
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
