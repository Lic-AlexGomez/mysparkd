import type { EventsConfig, FeedConfig, LayoutFlags, ProfileConfig, DiscoverConfig } from "@/lib/layout-flags"
import type { ExperienceObjective } from "@/lib/experience-mode"
import type { VisualAppearanceId } from "@/lib/visual-appearances"

/** Estado del recorrido guiado (legacy anidado, se sincroniza con campos planos). */
export interface OnboardingAssistantState {
  hasSeenWelcomeTour: boolean
  completedSteps: string[]
  dismissed: boolean
  lastStep: string | null
}

export const DEFAULT_ONBOARDING_ASSISTANT: OnboardingAssistantState = {
  hasSeenWelcomeTour: false,
  completedSteps: [],
  dismissed: false,
  lastStep: null,
}

/** Preferencias de IA (Groq vía proxy web /api/ai). */
export interface SparkyAISettings {
  enabled: boolean
  proactiveSuggestions: boolean
  useProfileForSuggestions: boolean
  useLocationApproximation: boolean
  useConversationContext: boolean
  safetyMode: boolean
}

export const DEFAULT_SPARKY_AI_SETTINGS: SparkyAISettings = {
  enabled: false,
  proactiveSuggestions: false,
  useProfileForSuggestions: true,
  useLocationApproximation: true,
  useConversationContext: false,
  safetyMode: true,
}

export type SparkyMode = "companion" | "coach" | "quiet"

export type SparkyPersonalityLevel = "calm" | "balanced" | "playful"

export type SparkyProactiveFrequency = "low" | "normal" | "high"

export interface SparkyLifeSettings {
  enabled: boolean
  personalityLevel: SparkyPersonalityLevel
  proactiveFrequency: SparkyProactiveFrequency
  allowIdleAnimations: boolean
  allowProactiveMessages: boolean
  allowCelebrations: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

export const DEFAULT_SPARKY_LIFE_SETTINGS: SparkyLifeSettings = {
  enabled: true,
  personalityLevel: "balanced",
  proactiveFrequency: "normal",
  allowIdleAnimations: true,
  allowProactiveMessages: true,
  allowCelebrations: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
}

export interface SparkyVoiceSettings {
  commandsEnabled: boolean
  speakResponses: boolean
  pushToTalkOnly: boolean
}

export const DEFAULT_SPARKY_VOICE_SETTINGS: SparkyVoiceSettings = {
  commandsEnabled: true,
  speakResponses: false,
  pushToTalkOnly: true,
}

/** Persistido en storage. */
export interface HelpAssistantSettings {
  enabled: boolean
  autoShow: boolean
  showWelcomeTour: boolean
  hasSeenWelcomeTour: boolean
  completedWelcomeTour: boolean
  contextualTipsEnabled: boolean
  tourSkipped: boolean
  dismissedRoutes: string[]
  /** Pantallas donde el usuario ya cerró tips contextuales (no auto-abrir de nuevo). */
  contextualTipsAcknowledgedRoutes?: string[]
  lastTourStep: string | null
  sparkyAI?: SparkyAISettings
  sparkyMode?: SparkyMode
  sparkyLife?: SparkyLifeSettings
  sparkyVoice?: SparkyVoiceSettings
  sparkyMemoryEnabled?: boolean
  dismissedNudges?: string[]
  nudgeLastShownAt?: Record<string, number>
  proactiveNudgesShownSession?: number
  /** @deprecated usar hasSeenWelcomeTour */
  hasSeenIntro?: boolean
  /** @deprecated usar showWelcomeTour */
  showTourForNewUsers?: boolean
  onboarding?: OnboardingAssistantState
}

export const DEFAULT_HELP_ASSISTANT_SETTINGS: HelpAssistantSettings = {
  enabled: true,
  autoShow: true,
  showWelcomeTour: true,
  hasSeenWelcomeTour: false,
  completedWelcomeTour: false,
  contextualTipsEnabled: true,
  tourSkipped: false,
  dismissedRoutes: [],
  contextualTipsAcknowledgedRoutes: [],
  lastTourStep: null,
  sparkyAI: { ...DEFAULT_SPARKY_AI_SETTINGS },
  sparkyMode: "companion",
  sparkyLife: { ...DEFAULT_SPARKY_LIFE_SETTINGS },
  sparkyVoice: { ...DEFAULT_SPARKY_VOICE_SETTINGS },
  sparkyMemoryEnabled: true,
  dismissedNudges: [],
  nudgeLastShownAt: {},
  proactiveNudgesShownSession: 0,
}

export function shouldAutoStartWelcomeTour(settings: HelpAssistantSettings): boolean {
  return (
    settings.enabled &&
    settings.showWelcomeTour &&
    !settings.hasSeenWelcomeTour &&
    !settings.completedWelcomeTour
  )
}

export function shouldAutoShowContextualTips(settings: HelpAssistantSettings): boolean {
  return (
    settings.enabled &&
    settings.autoShow &&
    settings.contextualTipsEnabled !== false
  )
}

export function shouldAutoOpenContextualTipsForRoute(
  settings: HelpAssistantSettings,
  routeStorageKey: string | null
): boolean {
  if (!shouldAutoShowContextualTips(settings)) return false
  if (!routeStorageKey) return false
  if (settings.dismissedRoutes.includes(routeStorageKey)) return false
  if (settings.contextualTipsAcknowledgedRoutes?.includes(routeStorageKey)) return false
  return true
}

export type SparkyTourStatus = "not_started" | "in_progress" | "skipped" | "completed"

export function getTourStatus(settings: HelpAssistantSettings): SparkyTourStatus {
  if (settings.completedWelcomeTour) return "completed"
  if (settings.tourSkipped) return "skipped"
  if (
    settings.hasSeenWelcomeTour &&
    settings.lastTourStep &&
    settings.lastTourStep !== "welcome" &&
    settings.lastTourStep !== "finish"
  ) {
    return "in_progress"
  }
  if (settings.hasSeenWelcomeTour && !settings.completedWelcomeTour) return "skipped"
  return "not_started"
}

export function getTourStatusLabel(settings: HelpAssistantSettings): string {
  switch (getTourStatus(settings)) {
    case "completed":
      return "Completado"
    case "skipped":
      return "Saltado"
    case "in_progress":
      return "En progreso"
    default:
      return "No iniciado"
  }
}

export type HelpRouteKey =
  | "feed"
  | "events"
  | "discover"
  | "profile"
  | "chat"
  | "settings-appearance"
  | "settings-general"
  | "settings"

export interface HelpAssistantContext {
  pathname: string
  settingsSection?: string | null
  visualAppearance: VisualAppearanceId
  layoutFlags: LayoutFlags
  feedConfig: FeedConfig
  eventsConfig: EventsConfig
  profileConfig: ProfileConfig
  discoverConfig: DiscoverConfig
  experienceObjective: ExperienceObjective
  isBothMode: boolean
  isSocialMode: boolean
  isDatingNav: boolean
}

/** Rutas donde Sparky puede mostrarse (tabs principales + ajustes + lista de chat). */
const VISIBLE_PATH_PREFIXES = ["/feed", "/events", "/swipes", "/profile", "/settings", "/chat"] as const

const HIDDEN_PATH_PATTERNS = [
  /^\/chat\/.+/,
  /^\/event\//,
  /^\/group\//,
  /^\/post\//,
  /^\/u\//,
  /^\/onboarding/,
  /^\/welcome/,
  /^\/login/,
  /^\/register/,
  /^\/auth/,
]

export function normalizeHelpAssistantSettings(raw: unknown): HelpAssistantSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_HELP_ASSISTANT_SETTINGS }
  const o = raw as Partial<HelpAssistantSettings> & {
    onboarding?: Partial<OnboardingAssistantState>
    showTourForNewUsers?: boolean
    hasSeenIntro?: boolean
  }
  const onboardingRaw = o.onboarding
  const sparkyAIRaw = o.sparkyAI
  const sparkyLifeRaw = o.sparkyLife
  const sparkyVoiceRaw = o.sparkyVoice
  const hasSeenWelcomeTour = Boolean(
    o.hasSeenWelcomeTour ?? onboardingRaw?.hasSeenWelcomeTour ?? o.hasSeenIntro
  )
  const completedWelcomeTour = Boolean(
    o.completedWelcomeTour ??
      (onboardingRaw?.completedSteps?.includes("finish") ? true : false)
  )
  return {
    enabled: o.enabled !== false,
    autoShow: o.autoShow !== false,
    showWelcomeTour: o.showWelcomeTour ?? o.showTourForNewUsers !== false,
    hasSeenWelcomeTour,
    completedWelcomeTour,
    contextualTipsEnabled: o.contextualTipsEnabled !== false,
    tourSkipped: Boolean(o.tourSkipped ?? onboardingRaw?.dismissed),
    dismissedRoutes: Array.isArray(o.dismissedRoutes)
      ? o.dismissedRoutes.filter((r): r is string => typeof r === "string")
      : [],
    contextualTipsAcknowledgedRoutes: Array.isArray(o.contextualTipsAcknowledgedRoutes)
      ? o.contextualTipsAcknowledgedRoutes.filter((r): r is string => typeof r === "string")
      : [],
    lastTourStep:
      typeof o.lastTourStep === "string"
        ? o.lastTourStep
        : typeof onboardingRaw?.lastStep === "string"
          ? onboardingRaw.lastStep
          : null,
    sparkyAI: {
      enabled: sparkyAIRaw?.enabled === true,
      proactiveSuggestions: sparkyAIRaw?.proactiveSuggestions === true,
      useProfileForSuggestions: sparkyAIRaw?.useProfileForSuggestions !== false,
      useLocationApproximation: sparkyAIRaw?.useLocationApproximation !== false,
      useConversationContext: sparkyAIRaw?.useConversationContext === true,
      safetyMode: sparkyAIRaw?.safetyMode !== false,
    },
    sparkyMode:
      o.sparkyMode === "coach" || o.sparkyMode === "quiet" || o.sparkyMode === "companion"
        ? o.sparkyMode
        : "companion",
    sparkyLife: {
      enabled: sparkyLifeRaw?.enabled !== false,
      personalityLevel:
        sparkyLifeRaw?.personalityLevel === "calm" ||
        sparkyLifeRaw?.personalityLevel === "playful" ||
        sparkyLifeRaw?.personalityLevel === "balanced"
          ? sparkyLifeRaw.personalityLevel
          : "balanced",
      proactiveFrequency:
        sparkyLifeRaw?.proactiveFrequency === "low" ||
        sparkyLifeRaw?.proactiveFrequency === "high" ||
        sparkyLifeRaw?.proactiveFrequency === "normal"
          ? sparkyLifeRaw.proactiveFrequency
          : "normal",
      allowIdleAnimations: sparkyLifeRaw?.allowIdleAnimations !== false,
      allowProactiveMessages: sparkyLifeRaw?.allowProactiveMessages !== false,
      allowCelebrations: sparkyLifeRaw?.allowCelebrations !== false,
      quietHoursEnabled: sparkyLifeRaw?.quietHoursEnabled === true,
      quietHoursStart:
        typeof sparkyLifeRaw?.quietHoursStart === "string"
          ? sparkyLifeRaw.quietHoursStart
          : DEFAULT_SPARKY_LIFE_SETTINGS.quietHoursStart,
      quietHoursEnd:
        typeof sparkyLifeRaw?.quietHoursEnd === "string"
          ? sparkyLifeRaw.quietHoursEnd
          : DEFAULT_SPARKY_LIFE_SETTINGS.quietHoursEnd,
    },
    sparkyVoice: {
      commandsEnabled: sparkyVoiceRaw?.commandsEnabled !== false,
      speakResponses: sparkyVoiceRaw?.speakResponses === true,
      pushToTalkOnly: sparkyVoiceRaw?.pushToTalkOnly !== false,
    },
    sparkyMemoryEnabled: o.sparkyMemoryEnabled !== false,
    dismissedNudges: Array.isArray(o.dismissedNudges)
      ? o.dismissedNudges.filter((id): id is string => typeof id === "string")
      : [],
    nudgeLastShownAt:
      o.nudgeLastShownAt && typeof o.nudgeLastShownAt === "object"
        ? (o.nudgeLastShownAt as Record<string, number>)
        : {},
    proactiveNudgesShownSession:
      typeof o.proactiveNudgesShownSession === "number" ? o.proactiveNudgesShownSession : 0,
  }
}

export function isSparkyVisibleForPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/"
  if (HIDDEN_PATH_PATTERNS.some((re) => re.test(path))) return false
  return VISIBLE_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export function resolveHelpRouteKey(
  pathname: string,
  settingsSection?: string | null
): HelpRouteKey | null {
  const path = pathname.split("?")[0] || "/"

  if (path.startsWith("/settings")) {
    if (settingsSection === "app-interface") return "settings-appearance"
    if (settingsSection === "app-general") return "settings-general"
    return "settings"
  }
  if (path.startsWith("/feed")) return "feed"
  if (path.startsWith("/events")) return "events"
  if (path.startsWith("/swipes")) return "discover"
  if (path.startsWith("/profile")) return "profile"
  if (path === "/chat" || path.endsWith("/chat")) return "chat"
  return null
}

/** Punto de extensión: tips síncronos estáticos. Para IA async ver resolveSparkyTips() en lib/sparky-ai.ts. */
export type SparkyMessageSource = "static" | "ai"

export const SPARKY_INTRO_MESSAGE =
  "¡Hola! Soy Sparky, tu guía neón en Sparkd. Tócame cuando quieras tips sobre cada pantalla, skin o modo de experiencia."

const SKIN_TIPS: Partial<
  Record<VisualAppearanceId, Partial<Record<HelpRouteKey, string>>>
> = {
  sparkd: {
    feed: "Skin Sparkd: la experiencia equilibrada con acentos cyan y magenta.",
  },
  "neon-eventos": {
    events: "Skin Neon Eventos: tarjetas con borde cyan/magenta y badges que resaltan citas activas.",
  },
  "feed-clasico": {
    feed: "Skin Feed Clásico: fondo negro puro con drawer de filtros y acentos cyan–morado.",
  },
  "cyber-negro": {
    feed: "Skin Cyber Negro: estética cyberpunk con historias en anillo neón.",
  },
  "obsidian-stats": {
    profile: "Skin Obsidian Stats: fondo obsidiana con barra de estadísticas de engagement.",
  },
  "neon-feed": {
    feed: "Skin Neon Feed: feed minimal con likes magenta y reposts cyan.",
  },
  "discover-cards": {
    discover: "Skin Discover Cards: perfiles grandes con botones circulares de acción rápida.",
  },
  "top-ranking": {
    feed: "Skin Top Ranking: podio con bordes oro, plata y bronce para los más activos.",
  },
  "feed-tabs": {
    feed: "Skin Feed Tabs: pestañas Para ti / Siguiendo con subrayado cyan activo.",
  },
  "dock-flotante": {
    feed: "Skin Dock Flotante: barra glass flotante y acentos verde neón en reposts.",
    "settings-appearance": "Skin Dock Flotante: combina nav glass con repost verde neón en el feed.",
  },
  "ranking-corona": {
    feed: "Skin Ranking Corona: top 3 superpuesto con corona dorada en el feed.",
  },
  "perfil-neon": {
    profile: "Skin Perfil Neon: stats destacados, tabs de actividad y nav curvo integrado.",
  },
  "eventos-compacto": {
    events: "Skin Eventos Compacto: lista densa con headers en gradiente para ver más planes.",
  },
}

function appendSkinTip(tips: string[], ctx: HelpAssistantContext, routeKey: HelpRouteKey) {
  const skinTip = SKIN_TIPS[ctx.visualAppearance]?.[routeKey]
  if (skinTip && !tips.includes(skinTip)) tips.push(skinTip)
}

export function buildSparkyTips(ctx: HelpAssistantContext): string[] {
  const routeKey = resolveHelpRouteKey(ctx.pathname, ctx.settingsSection)
  if (!routeKey) return []

  const tips: string[] = []

  switch (routeKey) {
    case "feed":
      tips.push("Tip: revisa tendencias para ver qué pasa cerca de ti.")
      if (ctx.layoutFlags.showTopRanking) {
        tips.push("Este ranking muestra lo más activo ahora.")
      }
      if (ctx.layoutFlags.showFeedTabs || ctx.feedConfig.tabStyle === "discover") {
        tips.push("Cambia entre Para ti, Siguiendo, Cerca y Nuevos.")
      }
      if (ctx.isSocialMode) {
        tips.push("En modo Social, el feed y la comunidad son el centro de la experiencia.")
      }
      if (ctx.isDatingNav) {
        tips.push("En modo Conexión, la barra inferior prioriza citas y matches.")
      }
      if (ctx.isBothMode) {
        tips.push("En modo Ambos puedes personalizar los 12 estilos de navbar en Apariencia.")
      }
      appendSkinTip(tips, ctx, routeKey)
      break

    case "events":
      tips.push("Los Group Meetups son para planes grupales.")
      tips.push("Los Fast Dates son encuentros rápidos para conectar.")
      if (ctx.layoutFlags.useCompactEvents || ctx.eventsConfig.layout === "compact") {
        tips.push("Esta vista muestra más eventos en menos espacio.")
      }
      if (ctx.layoutFlags.useNeonEventCards || ctx.eventsConfig.neonBorders) {
        tips.push("Los bordes neón resaltan eventos activos o recomendados.")
      }
      appendSkinTip(tips, ctx, routeKey)
      break

    case "discover":
      tips.push("Spark muestra más interés que un like normal.")
      tips.push("Star puede reservarse para tus favoritos.")
      if (ctx.layoutFlags.useSwipeDiscoverCards || ctx.discoverConfig.largeCards) {
        tips.push("Esta vista prioriza perfiles grandes y acciones rápidas.")
      }
      if (ctx.experienceObjective === "connection") {
        tips.push("En modo Conexión, Discover y Matches son tu foco principal.")
      }
      appendSkinTip(tips, ctx, routeKey)
      break

    case "profile":
      tips.push("Tu Spark Score refleja actividad y conexión.")
      if (ctx.layoutFlags.useProfileNeon) {
        tips.push("Usa las tabs para separar Sparks, Meetups y Guardados.")
      }
      if (ctx.layoutFlags.useObsidianStats || ctx.profileConfig.statsVariant === "obsidian") {
        tips.push("Esta vista destaca tus estadísticas de engagement.")
      }
      appendSkinTip(tips, ctx, routeKey)
      break

    case "chat":
      tips.push("Aquí ves tus conversaciones directas y chats generales.")
      tips.push("Toca un chat para abrirlo; Sparky se oculta dentro de la conversación para no estorbar.")
      break

    case "settings-appearance":
      tips.push("Tap aplica una skin. Long press aplica todo el preset.")
      tips.push("El modo de experiencia define qué navbar ves.")
      appendSkinTip(tips, ctx, routeKey)
      break

    case "settings-general":
      tips.push("El modo de experiencia define si Sparkd funciona como Social, Conexión o Ambos.")
      if (ctx.isBothMode) {
        tips.push("En Ambos puedes elegir entre 12 estilos de navbar en Apariencia e interfaz.")
      }
      break

    case "settings":
      tips.push("Desde Ajustes controlas tu cuenta, privacidad, apariencia y seguridad.")
      tips.push("Busca «Apariencia e interfaz» para cambiar skins y la barra inferior.")
      break
  }

  return tips
}

export function getSparkyRouteStorageKey(routeKey: HelpRouteKey | null): string | null {
  return routeKey
}
