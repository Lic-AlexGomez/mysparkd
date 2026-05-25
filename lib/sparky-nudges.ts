import type { SparkyAction } from "@/lib/sparky-actions"
import type { HelpRouteKey } from "@/lib/help-assistant"

export type SparkyNudgeType =
  | "profile_completion"
  | "match_suggestion"
  | "event_suggestion"
  | "message_help"
  | "appearance_tip"
  | "discover_tip"
  | "safety_tip"
  | "engagement_tip"
  | "city_trending"
  | "icebreaker"

export type SparkyNudgeSource = "local" | "grok"

export interface SparkyNudge {
  id: string
  type: SparkyNudgeType
  priority: number
  route: HelpRouteKey | string
  title: string
  message: string
  actionLabel?: string
  action?: SparkyAction
  cooldownMs: number
  dismissible: boolean
  source: SparkyNudgeSource
}

export type SparkyNudgeContext = {
  pathname: string
  routeKey: HelpRouteKey | null
  profileCompleted?: boolean
  bioLength?: number
  photoCount?: number
  interestCount?: number
  matchCount?: number
  eventCountNearby?: number
  isDatingNav?: boolean
  isBothMode?: boolean
  visualAppearance?: string
  experienceMode?: string
}

const DEFAULT_COOLDOWN_MS = 1000 * 60 * 60 * 12

export function buildLocalSparkyNudges(ctx: SparkyNudgeContext): SparkyNudge[] {
  const nudges: SparkyNudge[] = []

  if (ctx.routeKey === "profile" && (!ctx.profileCompleted || (ctx.bioLength ?? 0) < 20)) {
    nudges.push({
      id: "profile-bio-short",
      type: "profile_completion",
      priority: 90,
      route: "profile",
      title: "Perfil más completo",
      message: "Tu perfil puede conectar mejor con una bio corta. ¿Quieres que te ayude?",
      actionLabel: "Mejorar perfil",
      action: { type: "improve_profile" },
      cooldownMs: DEFAULT_COOLDOWN_MS,
      dismissible: true,
      source: "local",
    })
  }

  if (ctx.routeKey === "discover" && ctx.isDatingNav) {
    nudges.push({
      id: "discover-compat-tip",
      type: "discover_tip",
      priority: 70,
      route: "discover",
      title: "Tip Discover",
      message: "Puedo sugerirte perfiles más compatibles según tus intereses.",
      actionLabel: "Ver tip",
      action: { type: "navigate", route: "/(main)/(tabs)/swipes" },
      cooldownMs: DEFAULT_COOLDOWN_MS,
      dismissible: true,
      source: "local",
    })
  }

  if (ctx.routeKey === "events" && (ctx.eventCountNearby ?? 0) > 0) {
    nudges.push({
      id: "events-nearby",
      type: "event_suggestion",
      priority: 75,
      route: "events",
      title: "Eventos cerca",
      message: "Hay eventos activos cerca. ¿Quieres ver cuál encaja contigo?",
      actionLabel: "Explorar",
      action: { type: "navigate", route: "/(main)/(tabs)/events" },
      cooldownMs: DEFAULT_COOLDOWN_MS,
      dismissible: true,
      source: "local",
    })
  }

  if (ctx.routeKey === "chat") {
    nudges.push({
      id: "chat-icebreaker",
      type: "message_help",
      priority: 65,
      route: "chat",
      title: "Romper el hielo",
      message: "¿Quieres una frase para iniciar conversación?",
      actionLabel: "Ayúdame",
      action: { type: "generate_icebreaker" },
      cooldownMs: DEFAULT_COOLDOWN_MS,
      dismissible: true,
      source: "local",
    })
  }

  if (ctx.routeKey === "settings-appearance") {
    nudges.push({
      id: "appearance-vibe",
      type: "appearance_tip",
      priority: 60,
      route: "settings-appearance",
      title: "Tu estilo",
      message: "Tu app puede verse más como tú. Te ayudo a elegir un tema.",
      actionLabel: "Ver sugerencia",
      action: { type: "open_settings", section: "app-interface" },
      cooldownMs: DEFAULT_COOLDOWN_MS,
      dismissible: true,
      source: "local",
    })
  }

  if (ctx.isDatingNav) {
    nudges.push({
      id: "safety-first-date",
      type: "safety_tip",
      priority: 50,
      route: ctx.routeKey ?? "discover",
      title: "Tip de seguridad",
      message: "Para primeras citas, elige lugares públicos y avisa a alguien de confianza.",
      cooldownMs: DEFAULT_COOLDOWN_MS * 2,
      dismissible: true,
      source: "local",
    })
  }

  return nudges.sort((a, b) => b.priority - a.priority)
}

export function pickBestNudge(
  nudges: SparkyNudge[],
  dismissedIds: string[],
  lastShownAt: Record<string, number>,
  now = Date.now()
): SparkyNudge | null {
  for (const nudge of nudges) {
    if (dismissedIds.includes(nudge.id)) continue
    const last = lastShownAt[nudge.id] ?? 0
    if (now - last < nudge.cooldownMs) continue
    return nudge
  }
  return null
}
