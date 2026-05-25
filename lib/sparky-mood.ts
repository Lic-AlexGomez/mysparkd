import type { HelpRouteKey, HelpAssistantSettings, SparkyMode } from "@/lib/help-assistant"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { SparkyEngagementTier } from "@/lib/sparky-engagement"

/** Mood emocional del personaje (no confundir con motion mood). */
export type SparkyCharacterMood =
  | "chill"
  | "curious"
  | "hyped"
  | "supportive"
  | "playful"
  | "sleepy"
  | "proud"

export type SparkyMoodContext = {
  settings: HelpAssistantSettings
  routeKey: HelpRouteKey | null
  engagementTier: SparkyEngagementTier
  profileCompleted?: boolean
  isTourJustFinished?: boolean
  celebrateActive?: boolean
}

export function resolveSparkyMood(ctx: SparkyMoodContext): SparkyCharacterMood {
  if (ctx.settings.sparkyMode === "quiet") return "sleepy"
  if (ctx.celebrateActive) return "hyped"
  if (ctx.isTourJustFinished) return "proud"
  if (!ctx.profileCompleted && ctx.routeKey === "profile") return "supportive"
  if (ctx.settings.sparkyMode === "coach") return "curious"
  if (ctx.engagementTier === "bonded") return "playful"
  if (ctx.engagementTier === "withdrawn") return "chill"
  if (ctx.routeKey === "events") return "hyped"
  if (ctx.routeKey === "discover") return "curious"
  return "chill"
}

export function moodLabel(mood: SparkyCharacterMood): string {
  const labels: Record<SparkyCharacterMood, string> = {
    chill: "tranqui",
    curious: "curioso",
    hyped: "con energía",
    supportive: "apoyándote",
    playful: "juguetón",
    sleepy: "en silencio",
    proud: "orgulloso",
  }
  return labels[mood]
}

export function moodToExpression(mood: SparkyCharacterMood): SparkyExpression {
  switch (mood) {
    case "hyped":
      return "excited"
    case "curious":
      return "thinking"
    case "supportive":
      return "happy"
    case "playful":
      return "wink"
    case "sleepy":
      return "sleepy"
    case "proud":
      return "celebrating"
    default:
      return "idle"
  }
}

export function adaptivePresenceLevel(
  settings: HelpAssistantSettings,
  engagementTier: SparkyEngagementTier
): "quiet" | "normal" | "playful" {
  if (settings.sparkyMode === "quiet" || engagementTier === "withdrawn") return "quiet"
  if (settings.sparkyMode === "coach" || engagementTier === "bonded") return "playful"
  return "normal"
}
