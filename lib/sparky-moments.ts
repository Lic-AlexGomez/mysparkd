import type { HelpRouteKey, HelpAssistantSettings } from "@/lib/help-assistant"
import { pickSparkyCopy } from "@/lib/sparky-copy"
import type { SparkyEngagementTier, SparkyPresenceLevel } from "@/lib/sparky-engagement"

export type SparkyMomentType =
  | "daily_greeting"
  | "daily_vibe"
  | "first_open_today"
  | "match_celebration"
  | "event_hype"
  | "profile_boost"
  | "theme_reaction"
  | "quiet_checkin"
  | "streak_soft"
  | "city_energy"

export type SparkyMoment = {
  id: string
  type: SparkyMomentType
  message?: string
  /** strong = cuenta para límite 1/sesión */
  strength: "soft" | "strong"
  expression?: "wink" | "happy" | "excited" | "thinking"
}

export type SparkyMomentContext = {
  settings: HelpAssistantSettings
  routeKey: HelpRouteKey | null
  presence: SparkyPresenceLevel
  engagementTier: SparkyEngagementTier
  nickname?: string
  isFirstOpenToday: boolean
  profileCompleted?: boolean
  strongShownSession: number
  daySeed: string
}

const DAILY_VIBES = [
  "social pero sin presión",
  "tranqui con un toque de glow",
  "curioso y abierto",
  "ligero, sin drama",
  "buena energía para conectar",
]

export function getDailyVibeLine(seed: string): string {
  const n = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return `Vibe de hoy: ${DAILY_VIBES[n % DAILY_VIBES.length]} ✨`
}

export function pickSparkyMoment(ctx: SparkyMomentContext): SparkyMoment | null {
  if (!ctx.settings.enabled || ctx.settings.sparkyMode === "quiet") return null
  if (ctx.presence === "hidden") return null

  const name = ctx.nickname ? `, ${ctx.nickname}` : ""
  const seed = ctx.daySeed

  if (ctx.isFirstOpenToday && ctx.strongShownSession < 1) {
    return {
      id: `first-open-${seed}`,
      type: "first_open_today",
      message: `Volviste${name}. Me guardé un par de ideas para ti.`,
      strength: "strong",
      expression: "happy",
    }
  }

  if (ctx.strongShownSession >= 1) {
    if (ctx.presence !== "present") return null
    if (seed.endsWith("7")) {
      return {
        id: `soft-wink-${seed}`,
        type: "streak_soft",
        strength: "soft",
        expression: "wink",
      }
    }
    return null
  }

  if (ctx.routeKey === "profile" && !ctx.profileCompleted) {
    return {
      id: `profile-boost-${seed}`,
      type: "profile_boost",
      message: "Tu perfil está casi listo para brillar más.",
      strength: "strong",
      expression: "thinking",
    }
  }

  if (ctx.routeKey === "events") {
    return {
      id: `event-hype-${seed}`,
      type: "event_hype",
      message: "Hay movimiento cerca. Podría ser buen día para salir.",
      strength: "strong",
      expression: "excited",
    }
  }

  if (ctx.settings.sparkyMode === "coach") {
    return {
      id: `daily-greet-${seed}`,
      type: "daily_greeting",
      message: `Ey${name} ✨ hoy hay buena energía por aquí.`,
      strength: "strong",
      expression: "wink",
    }
  }

  return {
    id: `daily-vibe-${seed}`,
    type: "daily_vibe",
    message: getDailyVibeLine(seed),
    strength: "soft",
    expression: "happy",
  }
}

export function quietCheckinMoment(): SparkyMoment {
  return {
    id: "quiet-checkin",
    type: "quiet_checkin",
    message: pickSparkyCopy("support"),
    strength: "soft",
    expression: "happy",
  }
}
