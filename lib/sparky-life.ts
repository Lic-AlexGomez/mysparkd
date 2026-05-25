import type { HelpAssistantSettings, HelpRouteKey, SparkyLifeSettings } from "@/lib/help-assistant"
import { getPersonalityLimits, pickSparkyPhrase, type SparkyEmotion } from "@/lib/sparky-personality"
import type { SparkyEngagementTier, SparkyPresenceLevel } from "@/lib/sparky-engagement"
import { getAdaptiveProactiveCap, allowsProactiveMessages } from "@/lib/sparky-engagement"

export type SparkyLifeAction =
  | { type: "wink" }
  | { type: "bounce" }
  | { type: "peek" }
  | { type: "sleep" }
  | { type: "wake" }
  | { type: "message"; text: string; emotion: SparkyEmotion }

export function isQuietHours(settings: SparkyLifeSettings, now = new Date()): boolean {
  if (!settings.quietHoursEnabled) return false
  const [sh, sm] = settings.quietHoursStart.split(":").map(Number)
  const [eh, em] = settings.quietHoursEnd.split(":").map(Number)
  const mins = now.getHours() * 60 + now.getMinutes()
  const start = sh * 60 + (sm || 0)
  const end = eh * 60 + (em || 0)
  if (start <= end) return mins >= start && mins < end
  return mins >= start || mins < end
}

export function shouldAllowProactiveLife(
  settings: HelpAssistantSettings,
  opts: {
    isModalOpen: boolean
    isChatDetail: boolean
    isTourActive: boolean
    proactiveShownSession: number
    presence: SparkyPresenceLevel
    engagementTier: SparkyEngagementTier
  }
): boolean {
  if (!settings.enabled) return false
  if (settings.sparkyMode === "quiet") return false
  if (!allowsProactiveMessages(opts.presence, opts.engagementTier)) return false
  const life = settings.sparkyLife
  if (!life?.enabled || !life.allowProactiveMessages) return false
  if (isQuietHours(life)) return false
  if (opts.isModalOpen || opts.isTourActive) return false
  if (opts.isChatDetail) return false
  const limits = getPersonalityLimits(life.personalityLevel)
  const baseCap =
    settings.sparkyMode === "coach"
      ? limits.proactivePerSession + 1
      : limits.proactivePerSession
  const max = getAdaptiveProactiveCap(baseCap, opts.engagementTier, opts.presence)
  if (opts.proactiveShownSession >= max) return false
  return true
}

export function pickIdleLifeAction(
  settings: HelpAssistantSettings,
  routeKey: HelpRouteKey | null,
  seed: number,
  opts: { presence: SparkyPresenceLevel; engagementTier: SparkyEngagementTier }
): SparkyLifeAction | null {
  const life = settings.sparkyLife
  if (!life?.enabled || !life.allowIdleAnimations) return null
  if (settings.sparkyMode === "quiet") return null
  if (opts.presence === "hidden") return null
  if (isQuietHours(life)) return null

  const roll = seed % 10
  const { presence, engagementTier } = opts

  if (presence === "subtle") {
    if (roll < 2) return { type: "wink" }
    return null
  }

  if (engagementTier === "withdrawn") {
    if (roll < 2) return { type: "wink" }
    return null
  }

  if (roll < 3) return { type: "wink" }
  if (roll < 5) return { type: "bounce" }
  if (roll < 6 && routeKey === "feed") return { type: "peek" }
  if (
    roll < 7 &&
    settings.sparkyMode === "coach" &&
    life.allowProactiveMessages &&
    life.personalityLevel !== "calm" &&
    engagementTier === "bonded"
  ) {
    const emotion: SparkyEmotion = routeKey === "events" ? "excited" : "curious"
    return { type: "message", text: pickSparkyPhrase(emotion, seed), emotion }
  }
  if (engagementTier === "bonded" && roll < 8) return { type: "bounce" }
  if (engagementTier === "neutral" && roll < 4) return { type: "bounce" }
  return null
}

export function celebrationAllowed(settings: HelpAssistantSettings): boolean {
  return Boolean(settings.sparkyLife?.allowCelebrations) && settings.sparkyMode !== "quiet"
}
