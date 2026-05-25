"use client"

import { useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import { SparkyCharacter } from "@/components/sparky/sparky-character"
import { SparkyInlineBubble } from "@/components/sparky/sparky-inline-bubble"
import { SparkyPocket } from "@/components/sparky/sparky-pocket"
import { moodToExpression } from "@/lib/sparky-mood"
import { SPARKY_ANCHOR_POSITION } from "@/lib/sparky-motion"
import { useSparkyWeb } from "@/lib/hooks/use-sparky-web"
import { cn } from "@/lib/utils"

export function SparkyAssistantShell() {
  const sparky = useSparkyWeb()
  const pathname = usePathname()
  const lastTap = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTap.current < 320) {
      /* double tap — extra wink vibe via quick second tap feel */
    }
    lastTap.current = now
    sparky.onSparkyTap()
  }, [sparky])

  if (!sparky.showFab || pathname.startsWith("/chat/")) return null

  const pos = SPARKY_ANCHOR_POSITION[sparky.anchor]
  const inline = sparky.inlineBubble
  const expression = inline.visible
    ? inline.loading
      ? "thinking"
      : "speaking"
    : moodToExpression(sparky.sparkyMood)

  return (
    <>
      <div
        className="pointer-events-none fixed z-[9000] transition-all duration-500 ease-out"
        style={{
          bottom: pos.bottom,
          right: pos.right,
          left: pos.left,
        }}
      >
        <button
          type="button"
          className={cn(
            "pointer-events-auto cursor-pointer transition-transform hover:scale-105 active:scale-95",
            inline.visible && "scale-105"
          )}
          onClick={handleTap}
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
          aria-label="Sparky — toca para hablar, mantén para más opciones"
        >
          <SparkyCharacter expression={expression} size={56} pulse={inline.visible} />
        </button>

        <SparkyInlineBubble
          visible={inline.visible}
          message={inline.message}
          loading={inline.loading}
          hint={inline.hint}
          className="absolute bottom-full mb-2 right-0"
          actions={inline.actions.map((a) => ({
            label: a.label,
            variant: a.variant,
            onPress: () => {
              if (a.id === "close") sparky.dismissInlineBubble()
              else void sparky.runInlineAction(a.id)
            },
          }))}
          onClose={() => sparky.dismissInlineBubble(true)}
          onMore={sparky.openPocket}
        />
      </div>

      <SparkyPocket
        open={sparky.pocketOpen}
        onClose={sparky.closePocket}
        mood={sparky.sparkyMood}
        bondLabel={sparky.bondLabel}
        bondProgress={sparky.bondProgress}
        actions={sparky.contextActions}
        onAction={() => sparky.openPocket()}
        onQuietMode={() => {
          sparky.setSparkyMode("quiet")
          sparky.closePocket()
        }}
      />
    </>
  )
}
