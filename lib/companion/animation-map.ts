import type { CompanionEvent, CompanionMood, CompanionMotionHint } from "@/lib/companion/context-signals"
import { moodToSparkyExpression } from "@/lib/companion/engine"
import type { SparkyExpression } from "@/components/sparky/sparky-types"

export type LottieMoodKey = "celebrate" | "shiver" | "peek" | "sleep" | "none"

export type AnimationSpec = {
  expression: SparkyExpression
  lottie: LottieMoodKey
  motion: CompanionMotionHint
  useBreathing: boolean
  useSaccades: boolean
}

const MOOD_SPEC: Record<CompanionMood, AnimationSpec> = {
  idle: { expression: "idle", lottie: "none", motion: "none", useBreathing: true, useSaccades: true },
  happy: { expression: "happy", lottie: "none", motion: "bounce", useBreathing: true, useSaccades: true },
  sleepy: { expression: "sleepy", lottie: "sleep", motion: "none", useBreathing: true, useSaccades: false },
  curious: { expression: "thinking", lottie: "peek", motion: "peek", useBreathing: true, useSaccades: true },
  excited: { expression: "excited", lottie: "celebrate", motion: "bounce", useBreathing: true, useSaccades: true },
  confused: { expression: "confused", lottie: "none", motion: "think", useBreathing: true, useSaccades: true },
  sad: { expression: "sad", lottie: "none", motion: "none", useBreathing: true, useSaccades: false },
  celebrating: {
    expression: "celebrating",
    lottie: "celebrate",
    motion: "celebrate",
    useBreathing: true,
    useSaccades: true,
  },
  thinking: { expression: "thinking", lottie: "none", motion: "think", useBreathing: true, useSaccades: true },
  scared: { expression: "scared", lottie: "shiver", motion: "shiver", useBreathing: true, useSaccades: true },
}

export function resolveAnimationSpec(
  mood: CompanionMood,
  motionHint: CompanionMotionHint = "none"
): AnimationSpec {
  const base = MOOD_SPEC[mood] ?? MOOD_SPEC.idle
  if (motionHint === "none") return base
  return {
    ...base,
    expression: moodToSparkyExpression(mood),
    lottie: motionHint === "celebrate" ? "celebrate" : motionHint === "shiver" ? "shiver" : base.lottie,
    motion: motionHint,
  }
}

export function lottieEnabledForExpression(expression: SparkyExpression): boolean {
  return (
    expression === "celebrating" ||
    expression === "excited" ||
    expression === "speaking" ||
    expression === "scared"
  )
}

export function eventWantsLottie(event: CompanionEvent): LottieMoodKey {
  switch (event) {
    case "success":
    case "achievement":
    case "tour_complete":
      return "celebrate"
    case "rage_click":
      return "shiver"
    case "scroll_fast":
      return "peek"
    case "user_idle":
    case "app_background":
      return "sleep"
    default:
      return "none"
  }
}
