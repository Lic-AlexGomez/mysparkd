"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, useMotionValue } from "framer-motion"
import { SparkyRobot } from "@/components/sparky/sparky-robot"
import { SparkyInlineBubble } from "@/components/sparky/sparky-inline-bubble"
import { SparkyPocket } from "@/components/sparky/sparky-pocket"
import { moodToExpression } from "@/lib/sparky-mood"
import { useSparkyWeb } from "@/lib/hooks/use-sparky-web"
import { useSparkyPresence } from "@/lib/hooks/use-sparky-presence"
import { routeToContextAnchor } from "@/lib/sparky-anchors"
import { cn } from "@/lib/utils"
import { pickSparkyPhrase } from "@/lib/sparky-personality"
import type { SparkyExpression } from "@/components/sparky/sparky-types"

const ROBOT_SIZE = 64

export function SparkyAssistantShell() {
  const sparky = useSparkyWeb()
  const pathname = usePathname()
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const lastTap = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [microMsg, setMicroMsg] = useState<string | null>(null)
  const prevInlineVisible = useRef(false)

  const paused = sparky.pocketOpen || sparky.inlineBubble.visible

  const handleMicroMessage = useCallback((text: string) => {
    setMicroMsg(text)
    window.setTimeout(() => setMicroMsg(null), 5500)
  }, [])

  const presence = useSparkyPresence({
    settings: sparky.settings,
    routeKey: sparky.routeKey,
    memory: sparky.sparkyMemory,
    enabled: sparky.showFab,
    paused,
    pathname,
    onMicroMessage: handleMicroMessage,
  })

  const showMicro = microMsg && !sparky.inlineBubble.visible

  useEffect(() => {
    if (!sparky.showFab || pathname.startsWith("/chat/")) return
    if (sparky.settings.sparkyMode !== "coach" || !sparky.settings.autoShow) return
    if (paused) return

    const t = setTimeout(() => {
      if (Math.random() < 0.4) {
        handleMicroMessage(pickSparkyPhrase("curious", Date.now()))
        presence.moveToAnchor(routeToContextAnchor(sparky.routeKey))
      }
    }, 8000)
    return () => clearTimeout(t)
  }, [
    pathname,
    sparky.routeKey,
    sparky.settings.sparkyMode,
    sparky.settings.autoShow,
    paused,
    sparky.showFab,
    handleMicroMessage,
    presence.moveToAnchor,
  ])

  const inline = sparky.inlineBubble

  useEffect(() => {
    if (inline.visible && !prevInlineVisible.current) {
      presence.think()
      presence.moveToAnchor(routeToContextAnchor(sparky.routeKey))
    }
    prevInlineVisible.current = inline.visible
  }, [inline.visible, sparky.routeKey, presence.think, presence.moveToAnchor])

  const handleTap = useCallback(() => {
    const now = Date.now()
    presence.wake()
    if (now - lastTap.current < 350) {
      presence.wink()
      presence.celebrate()
    } else {
      presence.bounce()
    }
    lastTap.current = now
    sparky.onSparkyTap()
    presence.moveToAnchor(routeToContextAnchor(sparky.routeKey))
  }, [presence, sparky])

  const handleDragEnd = useCallback(() => {
    presence.setIsDragging(false)
    const el = document.getElementById("sparky-roam-root")
    if (!el || typeof window === "undefined") return
    const rect = el.getBoundingClientRect()
    presence.dragTo({
      bottom: Math.max(58, window.innerHeight - rect.bottom),
      right: Math.max(10, window.innerWidth - rect.right),
    })
    dragX.set(0)
    dragY.set(0)
  }, [presence, dragX, dragY])

  if (!sparky.showFab || pathname.startsWith("/chat/")) return null

  const expression: SparkyExpression = inline.visible
    ? inline.loading
      ? "thinking"
      : "speaking"
    : moodToExpression(sparky.sparkyMood)

  const robotAnim = inline.visible
    ? inline.loading
      ? "think"
      : presence.animMode === "think"
        ? "float"
        : presence.animMode
    : presence.animMode

  const pos = presence.position
  const posStyle: React.CSSProperties = {
    position: "fixed",
    bottom: pos.bottom,
    zIndex: 9000,
    ...(pos.left != null ? { left: pos.left } : { right: pos.right ?? 12 }),
  }

  return (
    <>
      <motion.div
        id="sparky-roam-root"
        className="pointer-events-none"
        style={posStyle}
        animate={{
          bottom: pos.bottom,
          ...(pos.left != null ? { left: pos.left, right: "auto" } : { right: pos.right ?? 12, left: "auto" }),
        }}
        transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.8 }}
      >
        {/* Estela al caminar */}
        {presence.animMode === "walk" && (
          <motion.div
            className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            <span className="h-1 w-1 rounded-full bg-primary/60" />
            <span className="h-1 w-1 rounded-full bg-secondary/50" />
            <span className="h-1 w-1 rounded-full bg-primary/40" />
          </motion.div>
        )}

        <motion.div
          role="button"
          tabIndex={0}
          className="pointer-events-auto cursor-grab outline-none active:cursor-grabbing"
          style={{ x: dragX, y: dragY }}
          drag
          dragMomentum={false}
          dragElastic={0.12}
          onDragStart={() => presence.setIsDragging(true)}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.92 }}
          onClick={handleTap}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleTap()
          }}
          onPointerDown={() => {
            longPressTimer.current = setTimeout(() => sparky.onSparkyLongPress(), 520)
          }}
          onPointerUp={() => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current)
          }}
          onPointerLeave={() => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current)
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            sparky.onSparkyLongPress()
          }}
          aria-label="Sparky — arrastra para moverlo, toca para hablar, mantén para más opciones"
        >
          <SparkyRobot
            expression={expression}
            size={ROBOT_SIZE}
            facing={presence.facing}
            animMode={robotAnim}
            blinking={presence.blinking}
            winking={presence.winking}
            speaking={inline.visible}
          />
        </motion.div>

        <SparkyInlineBubble
          visible={inline.visible}
          message={inline.message}
          loading={inline.loading}
          hint={inline.hint}
          className="pointer-events-auto absolute bottom-full right-0 mb-2"
          actions={inline.actions.map((a) => ({
            label: a.label,
            variant: a.variant,
            onPress: () => {
              if (a.id === "close") {
                sparky.dismissInlineBubble()
                presence.returnHome()
              } else void sparky.runInlineAction(a.id)
            },
          }))}
          onClose={() => {
            sparky.dismissInlineBubble(true)
            presence.returnHome()
          }}
          onMore={sparky.openPocket}
        />

        {showMicro ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto absolute bottom-full right-0 mb-2 max-w-[200px] rounded-lg border border-primary/30 bg-card/95 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md"
          >
            {microMsg}
          </motion.div>
        ) : null}
      </motion.div>

      <SparkyPocket
        open={sparky.pocketOpen}
        onClose={sparky.closePocket}
        mood={sparky.sparkyMood}
        bondLabel={sparky.bondLabel}
        bondProgress={sparky.bondProgress}
        actions={sparky.contextActions}
        onAction={(id) => void sparky.runInlineAction(id)}
        onQuietMode={() => {
          sparky.setSparkyMode("quiet")
          sparky.closePocket()
        }}
      />
    </>
  )
}
