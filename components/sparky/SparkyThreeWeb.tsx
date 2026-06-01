"use client"

import dynamic from "next/dynamic"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"
import type { CompanionId } from "@/lib/companion/catalog"
import type { Sparky3DMood } from "@/lib/companion/sparky-face-web"

const SparkyThreeCanvas = dynamic(
  () => import("@/components/sparky/SparkyThreeCanvas").then((m) => m.SparkyThreeCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="animate-pulse rounded-full bg-gradient-to-br from-indigo-500/30 to-cyan-400/20"
        style={{ width: "100%", height: "100%" }}
      />
    ),
  }
)

type Props = {
  expression?: SparkyExpression
  companionId?: CompanionId
  size?: number
  gaze?: SparkyGaze
  wardrobeAccessory?: string | null
  className?: string
  reduceMotion?: boolean | null
}

function mapExpressionToMood(expression: SparkyExpression): Sparky3DMood {
  if (expression === "happy") return "happy"
  if (expression === "thinking") return "thinking"
  if (expression === "sad" || expression === "sleepy") return "sad"
  if (expression === "excited" || expression === "celebrating") return "excited"
  if (expression === "confused" || expression === "scared") return "confused"
  if (expression === "wink" || expression === "speaking") return "curious"
  return "idle"
}

export function SparkyThreeWeb({
  expression = "idle",
  size = 48,
  gaze = { x: 0, y: 0 },
  wardrobeAccessory = null,
  className = "",
  reduceMotion = false,
}: Props) {
  const h = size * 1.12

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-visible ${className}`}
      style={{ width: size, height: h }}
      aria-hidden
    >
      <SparkyThreeCanvas
        size={size}
        frameScale={size <= 56 ? 1.85 : 1.65}
        mood={mapExpressionToMood(expression)}
        gaze={gaze}
        reduceMotion={Boolean(reduceMotion)}
        wardrobeAccessory={wardrobeAccessory}
        interactive
        hovered={false}
        clickPulse={0}
      />
    </div>
  )
}
