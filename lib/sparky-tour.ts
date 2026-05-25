import type { HelpAssistantContext, HelpAssistantSettings } from "@/lib/help-assistant"
import type { SparkyTourAnchorId } from "@/lib/sparky-tour-anchors"
import type {
  SparkyBubblePlacement,
  SparkyExpression,
  SparkyTourStepId,
} from "@/components/sparky/sparky-types"

export interface SparkySpotlightRect {
  x: number
  y: number
  width: number
  height: number
}

export interface SparkyTourStepConfig {
  id: SparkyTourStepId
  title: string
  message: string
  expression: SparkyExpression
  route?: string
  settingsSection?: string
  placement: SparkyBubblePlacement
  /** Ancla en pantalla para spotlight real; fallback a `spotlight` si no está medida. */
  anchorId?: SparkyTourAnchorId
  spotlight?: SparkySpotlightRect | null
  primaryLabel?: string
  secondaryLabel?: string
}

const BASE_TOUR_STEPS: Omit<SparkyTourStepConfig, "message">[] = [
  {
    id: "welcome",
    title: "¡Hola, soy Sparky!",
    expression: "excited",
    placement: "center",
    spotlight: null,
    primaryLabel: "Empezar",
    secondaryLabel: "Saltar",
  },
  {
    id: "feed",
    title: "Tu feed",
    expression: "happy",
    route: "/(main)/(tabs)/feed",
    anchorId: "tour-feed-main",
    placement: "bottom",
    spotlight: { x: 0.04, y: 0.12, width: 0.92, height: 0.52 },
    primaryLabel: "Siguiente",
  },
  {
    id: "events",
    title: "Eventos",
    expression: "excited",
    route: "/(main)/(tabs)/events",
    anchorId: "tour-events-main",
    placement: "bottom",
    spotlight: { x: 0.04, y: 0.1, width: 0.92, height: 0.55 },
    primaryLabel: "Siguiente",
  },
  {
    id: "discover",
    title: "Discover",
    expression: "wink",
    route: "/(main)/(tabs)/swipes",
    anchorId: "tour-discover-main",
    placement: "top",
    spotlight: { x: 0.06, y: 0.08, width: 0.88, height: 0.58 },
    primaryLabel: "Siguiente",
  },
  {
    id: "profile",
    title: "Tu perfil",
    expression: "happy",
    route: "/(main)/(tabs)/profile",
    anchorId: "tour-profile-main",
    placement: "bottom",
    spotlight: { x: 0.04, y: 0.1, width: 0.92, height: 0.5 },
    primaryLabel: "Siguiente",
  },
  {
    id: "appearance",
    title: "Personaliza Sparkd",
    expression: "thinking",
    route: "/(main)/settings",
    settingsSection: "app-interface",
    anchorId: "tour-appearance-main",
    placement: "center",
    spotlight: { x: 0.06, y: 0.18, width: 0.88, height: 0.55 },
    primaryLabel: "Siguiente",
  },
  {
    id: "finish",
    title: "¡Listo!",
    expression: "celebrating",
    placement: "center",
    spotlight: null,
    primaryLabel: "Finalizar",
    secondaryLabel: "Volver a ver luego",
  },
]

const STEP_MESSAGES: Record<
  SparkyTourStepId,
  string | ((ctx: HelpAssistantContext) => string)
> = {
  welcome: "Te voy a enseñar Sparkd en menos de un minuto ✨",
  feed: (ctx) => {
    const parts = ["Aquí descubres publicaciones, historias, tendencias y actividad cerca de ti."]
    if (ctx.layoutFlags.showTopRanking) parts.push("El ranking destaca lo más activo ahora.")
    if (ctx.layoutFlags.showFeedTabs) parts.push("Usa las pestañas Para ti, Siguiendo, Cerca y Nuevos.")
    return parts.join(" ")
  },
  events: (ctx) => {
    const parts = ["Aquí encuentras Group Meetups y Fast Dates para conectar en la vida real."]
    if (ctx.layoutFlags.useCompactEvents || ctx.eventsConfig.layout === "compact") {
      parts.push("La vista compacta te deja ver más planes de un vistazo.")
    }
    return parts.join(" ")
  },
  discover: (ctx) => {
    const parts = ["Usa like, spark, star o descartar para encontrar personas compatibles."]
    if (ctx.layoutFlags.useSwipeDiscoverCards || ctx.discoverConfig.largeCards) {
      parts.push("Discover Cards prioriza perfiles grandes y acciones rápidas.")
    }
    return parts.join(" ")
  },
  profile: (ctx) => {
    const parts = ["Aquí ves tu actividad, Spark Score, estadísticas y contenido guardado."]
    if (ctx.layoutFlags.useProfileNeon) parts.push("Las tabs separan Sparks, meetups y guardados.")
    return parts.join(" ")
  },
  appearance: () =>
    "Puedes cambiar skins, colores, modo claro/oscuro y estilos de navbar. Tip: tap aplica skin, long press aplica preset.",
  finish: "Cuando necesites ayuda, tócame y te doy un tip rápido 💜",
}

export function buildSparkyTourSteps(ctx: HelpAssistantContext): SparkyTourStepConfig[] {
  return BASE_TOUR_STEPS.map((step) => {
    const msg = STEP_MESSAGES[step.id]
    const message = typeof msg === "function" ? msg(ctx) : msg
    return { ...step, message }
  })
}

export const SPARKY_TOUR_STEP_IDS: SparkyTourStepId[] = BASE_TOUR_STEPS.map((s) => s.id)

export function expressionForRoute(routeKey: string | null): SparkyExpression {
  switch (routeKey) {
    case "feed":
      return "happy"
    case "events":
      return "excited"
    case "discover":
      return "wink"
    case "profile":
      return "happy"
    case "settings-appearance":
    case "settings-general":
    case "settings":
      return "thinking"
    case "chat":
      return "thinking"
    default:
      return "idle"
  }
}

/** Rutas alternativas por step (primera = preferida). */
export const SPARKY_TOUR_ROUTE_CANDIDATES: Partial<Record<SparkyTourStepId, string[]>> = {
  feed: ["/(main)/(tabs)/feed", "/feed"],
  events: ["/(main)/(tabs)/events", "/events"],
  discover: ["/(main)/(tabs)/swipes", "/swipes"],
  profile: ["/(main)/(tabs)/profile", "/profile"],
  appearance: ["/(main)/settings", "/settings"],
}

export function isValidTourStepId(stepId: string | null | undefined): stepId is SparkyTourStepId {
  return Boolean(stepId && SPARKY_TOUR_STEP_IDS.includes(stepId as SparkyTourStepId))
}

export function normalizeLastTourStep(stepId: string | null | undefined): SparkyTourStepId | null {
  if (!isValidTourStepId(stepId)) return null
  if (stepId === "finish" || stepId === "welcome") return null
  return stepId
}

export function resolveTourStepIndex(
  stepId: string | null | undefined,
  steps: SparkyTourStepConfig[]
): number | null {
  const normalized = normalizeLastTourStep(stepId)
  if (!normalized) return null
  const idx = steps.findIndex((s) => s.id === normalized)
  return idx >= 0 ? idx : null
}

export function shouldShowResumeTourPrompt(
  settings: HelpAssistantSettings,
  sessionDismissed: boolean
): boolean {
  if (sessionDismissed) return false
  if (!settings.enabled || !settings.showWelcomeTour) return false
  if (settings.completedWelcomeTour) return false
  if (settings.tourSkipped) return false
  if (!settings.hasSeenWelcomeTour) return false
  return normalizeLastTourStep(settings.lastTourStep) != null
}

export function canContinueTour(settings: HelpAssistantSettings, steps: SparkyTourStepConfig[]): boolean {
  if (settings.completedWelcomeTour || settings.tourSkipped) return false
  return resolveTourStepIndex(settings.lastTourStep, steps) != null
}

/** Navegación segura: intenta rutas candidatas sin lanzar error. */
export function safeNavigateTourStep(
  step: SparkyTourStepConfig,
  push: (href: string) => void
): boolean {
  if (!step.route) return true
  const candidates = SPARKY_TOUR_ROUTE_CANDIDATES[step.id] ?? [step.route]
  for (const href of candidates) {
    try {
      push(href)
      return true
    } catch {
      /* siguiente candidato */
    }
  }
  return false
}
