"use client"

import dynamic from "next/dynamic"
import { useCallback, useRef, useState } from "react"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"
import type { Sparky3DMood } from "@/lib/companion/sparky-face-web"

const SparkyThreeCanvas = dynamic(
  () => import("@/components/sparky/SparkyThreeCanvas").then((m) => m.SparkyThreeCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="animate-pulse rounded-full bg-gradient-to-br from-fuchsia-500/25 via-violet-500/20 to-cyan-400/20"
        style={{ width: "100%", height: "100%" }}
      />
    ),
  }
)

type Sparky3DProps = {
  mood: Sparky3DMood
  size?: number
  interactive?: boolean
  gaze?: SparkyGaze
  wardrobeAccessory?: string | null
  className?: string
  reduceMotion?: boolean | null
}

const MOOD_GLOW: Record<Sparky3DMood, string> = {
  idle: "drop-shadow(0 0 8px rgba(34,211,238,0.4)) drop-shadow(0 0 14px rgba(232,121,249,0.18))",
  happy: "drop-shadow(0 0 10px rgba(34,211,238,0.48)) drop-shadow(0 0 16px rgba(244,114,182,0.22))",
  curious: "drop-shadow(0 0 8px rgba(167,139,250,0.35)) drop-shadow(0 0 14px rgba(34,211,238,0.16))",
  thinking: "drop-shadow(0 0 8px rgba(196,181,253,0.3)) drop-shadow(0 0 12px rgba(103,232,249,0.14))",
  sad: "drop-shadow(0 0 6px rgba(147,197,253,0.22))",
  excited: "drop-shadow(0 0 12px rgba(34,211,238,0.52)) drop-shadow(0 0 18px rgba(244,114,182,0.24))",
  confused: "drop-shadow(0 0 8px rgba(240,171,252,0.3)) drop-shadow(0 0 12px rgba(103,232,249,0.14))",
}

export function Sparky3D({
  mood,
  size = 48,
  interactive = true,
  gaze = { x: 0, y: 0 },
  wardrobeAccessory = null,
  className = "",
  reduceMotion = false,
}: Sparky3DProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState(false)
  const [mouseGaze, setMouseGaze] = useState<SparkyGaze>({ x: 0, y: 0 })
  const [clickPulse, setClickPulse] = useState(0)

  const onMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || !wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      setMouseGaze({ x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) })
    },
    [interactive]
  )

  const onLeave = useCallback(() => {
    setHovered(false)
    setMouseGaze({ x: 0, y: 0 })
  }, [])

  const onDown = useCallback(() => {
    if (!interactive) return
    setClickPulse(1)
    window.setTimeout(() => setClickPulse(0), 220)
  }, [interactive])

  const mergedGaze: SparkyGaze = {
    x: (gaze.x ?? 0) * 0.55 + mouseGaze.x * 0.75,
    y: (gaze.y ?? 0) * 0.55 + mouseGaze.y * 0.75,
  }

  const h = size * 1.12
  const compact = size <= 56

  const glow = MOOD_GLOW[mood] ?? MOOD_GLOW.idle

  return (
    <div
      ref={wrapperRef}
      data-sparky-3d="reference-blob-v3-clean"
      data-sparky-mood={mood}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-visible ${className}`}
      style={{
        width: size,
        height: h,
        filter: `${glow}${hovered ? " brightness(1.08)" : ""}`,
      }}
      aria-hidden
      onPointerMove={onMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={onLeave}
      onPointerDown={onDown}
    >
      <SparkyThreeCanvas
        size={size}
        frameScale={compact ? 1.55 : 1.35}
        mood={mood}
        gaze={mergedGaze}
        reduceMotion={Boolean(reduceMotion)}
        wardrobeAccessory={wardrobeAccessory}
        interactive={interactive}
        hovered={hovered}
        clickPulse={clickPulse}
        compact={size <= 56}
      />
    </div>
  )
}
