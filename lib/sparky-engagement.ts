/**
 * Reglas de producto Sparky (resumen):
 * - Más viva, no más ruidosa: presencia adaptativa + sin interrupciones en swipe/chat.
 * - Ignora → withdrawn (menos mensajes, idle más lento).
 * - Toca mucho → bonded (un poco más presente, con techo).
 * - Quiet Mode → hidden (FAB oculto; panel desde Ajustes).
 * - Swipe/chat → subtle (solo guiño ocasional; sin nudges ni auto-tips).
 */
import type { HelpAssistantSettings, HelpRouteKey } from "@/lib/help-assistant"
import type { SparkyMemory } from "@/lib/sparky-memory"
import { getPersonalityLimits, type SparkyPersonalityLevel } from "@/lib/sparky-personality"
import type { SparkyLifeAction } from "@/lib/sparky-life"

/** Cuánto puede interrumpir Sparky en la pantalla actual. */
export type SparkyPresenceLevel = "hidden" | "subtle" | "present"

/** Relación adaptativa según toques vs ignores. */
export type SparkyEngagementTier = "withdrawn" | "neutral" | "bonded"

/** Pantallas donde el usuario realiza acciones críticas (swipe, chat). */
export function isCriticalSparkyContext(pathname: string, routeKey: HelpRouteKey | null): boolean {
  if (routeKey === "discover") return true
  if (routeKey === "chat") return true
  if (/^\/chat\/.+/.test(pathname)) return true
  return false
}

export function getSparkyPresenceLevel(
  settings: Pick<HelpAssistantSettings, "enabled" | "sparkyMode">,
  pathname: string,
  routeKey: HelpRouteKey | null
): SparkyPresenceLevel {
  if (!settings.enabled || settings.sparkyMode === "quiet") return "hidden"
  if (isCriticalSparkyContext(pathname, routeKey)) return "subtle"
  return "present"
}

export function getEngagementTier(memory: SparkyMemory): SparkyEngagementTier {
  const touches = memory.touchCount ?? 0
  const ignores = memory.dismissCount ?? 0
  const streak = memory.ignoreStreak ?? 0

  if (streak >= 2 || ignores >= 4) return "withdrawn"
  if (touches >= 6 || (touches >= 3 && streak === 0 && ignores <= 1)) return "bonded"
  return "neutral"
}

export function recordSparkyTouch(memory: SparkyMemory): SparkyMemory {
  return {
    ...memory,
    touchCount: Math.min(999, (memory.touchCount ?? 0) + 1),
    ignoreStreak: 0,
    lastTouchAt: new Date().toISOString(),
  }
}

export function recordSparkyIgnore(memory: SparkyMemory): SparkyMemory {
  return {
    ...memory,
    dismissCount: (memory.dismissCount ?? 0) + 1,
    ignoreStreak: Math.min(99, (memory.ignoreStreak ?? 0) + 1),
    lastIgnoreAt: new Date().toISOString(),
  }
}

export function getAdaptiveIdleMs(
  personalityLevel: SparkyPersonalityLevel,
  tier: SparkyEngagementTier,
  presence: SparkyPresenceLevel
): number {
  const base = getPersonalityLimits(personalityLevel).idleMs
  let ms = base
  if (tier === "withdrawn") ms *= 2.5
  else if (tier === "bonded") ms *= 0.75
  if (presence === "subtle") ms *= 1.8
  return Math.round(ms)
}

export function getAdaptiveProactiveCap(
  baseCap: number,
  tier: SparkyEngagementTier,
  presence: SparkyPresenceLevel
): number {
  if (presence !== "present") return 0
  if (tier === "withdrawn") return 0
  if (tier === "bonded") return Math.min(baseCap + 1, 2)
  return baseCap
}

export function allowsProactiveMessages(presence: SparkyPresenceLevel, tier: SparkyEngagementTier): boolean {
  return presence === "present" && tier !== "withdrawn"
}

export function allowsNudges(presence: SparkyPresenceLevel, tier: SparkyEngagementTier): boolean {
  return presence === "present" && tier !== "withdrawn"
}

export function allowsAutoOpenTips(presence: SparkyPresenceLevel): boolean {
  return presence === "present"
}

/** En contexto crítico solo movimiento mínimo (guiño), nunca burbujas proactivas. */
export function filterLifeActionForPresence(
  action: SparkyLifeAction,
  presence: SparkyPresenceLevel
): SparkyLifeAction | null {
  if (presence === "hidden") return null
  if (presence === "subtle") {
    if (action.type === "wink" || action.type === "sleep" || action.type === "wake") return action
    return null
  }
  return action
}
