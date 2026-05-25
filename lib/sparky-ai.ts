import type { HelpAssistantContext, SparkyMessageSource } from "@/lib/help-assistant"
import {
  buildSparkyTips,
  resolveHelpRouteKey,
} from "@/lib/help-assistant"
import type { Event } from "@/lib/types"
import type { UserProfile } from "@/lib/types"
import {
  approximateCity,
  filterAiSuggestions,
  redactConversationMessages,
  sanitizeBio,
  sanitizeInterestLabels,
  stripPreciseLocation,
} from "@/lib/sparky-guardrails"
import { callGroqAi } from "@/lib/services/groq-ai"
import type { SparkyAISettings } from "@/lib/help-assistant"
import {
  buildLocalAppearanceRecommendation,
  type SparkyAppearancePatch,
} from "@/lib/sparky-appearance-local"
import { pickSparkyCopy } from "@/lib/sparky-copy"

const DATING_TIP_LABELS = ["Spark", "Like", "Tip"] as const

function dedupeSuggestions(tips: string[]): string[] {
  const seen = new Set<string>()
  return tips
    .map((t) => t.trim())
    .filter((t) => {
      if (!t) return false
      const key = t.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function localFallback(message: string, extra?: string[]): SparkyAiResponse {
  const tips = extra?.length ? [message, ...extra] : [message]
  return { suggestions: filterAiSuggestions(dedupeSuggestions(tips)), source: "static" }
}

function localDatingActionTips(
  viewer: Partial<UserProfile>,
  target: Partial<UserProfile>
): SparkyAiResponse {
  const shared = sanitizeInterestLabels(viewer.interests).filter((i) =>
    sanitizeInterestLabels(target.interests).some((t) => t.toLowerCase() === i.toLowerCase())
  )
  const parts = shared.length
    ? [
        `Si te llama la atención, Spark tiene sentido: comparten ${shared.slice(0, 2).join(" y ")}.`,
        "Si dudas, un like normal también vale — sin presión.",
        pickSparkyCopy("matching"),
      ]
    : [
        "Si te interesa, un like podría valer la pena.",
        "Spark marca más interés — úsalo si de verdad te llamó la atención.",
        "Si no conecta, descartar también es válido.",
      ]
  const suggestions = filterAiSuggestions(dedupeSuggestions(parts))
  return {
    suggestions,
    suggestionLabels: DATING_TIP_LABELS.slice(0, suggestions.length),
    source: "static",
  }
}

export type SparkyTipsResult = {
  tips: string[]
  source: SparkyMessageSource
}

export type SparkyAiResponse = {
  suggestions: string[]
  source: SparkyMessageSource
  error?: string
  safetyBlocked?: boolean
  /** Etiquetas por sugerencia (p. ej. Casual, Divertida, Coqueta). */
  suggestionLabels?: string[]
  appearancePatch?: SparkyAppearancePatch
}

export function isSparkyAiEnabled(settings?: SparkyAISettings): boolean {
  if (settings) return settings.enabled
  return process.env.EXPO_PUBLIC_SPARKY_AI_ENABLED === "true"
}

async function runGroqTask(
  task: Parameters<typeof callGroqAi>[0]["task"],
  sparkyContext: Record<string, unknown>,
  settings: SparkyAISettings
): Promise<SparkyAiResponse> {
  if (!settings.enabled) {
    return { suggestions: [], source: "static", error: "Funciones inteligentes desactivadas en Ajustes." }
  }

  const result = await callGroqAi({ task, sparkyContext })
  if (result.suggestions.length > 0) {
    return {
      suggestions: dedupeSuggestions(result.suggestions),
      source: result.source === "fallback" ? "static" : "ai",
      error: result.error,
    }
  }
  return {
    suggestions: [],
    source: "static",
    error: result.error ?? "Sparky no pudo conectar ahora mismo.",
  }
}

export async function resolveSparkyTips(
  ctx: HelpAssistantContext,
  settings?: SparkyAISettings
): Promise<SparkyTipsResult> {
  const staticTips = buildSparkyTips(ctx)
  const aiSettings = settings ?? { enabled: isSparkyAiEnabled(), proactiveSuggestions: false, useProfileForSuggestions: true, useLocationApproximation: true, useConversationContext: false, safetyMode: true }

  if (!aiSettings.enabled) {
    return { tips: staticTips, source: "static" }
  }

  const groq = await callGroqAi({
    task: "contextual_tips",
    sparkyContext: serializeSparkyContext(ctx, aiSettings),
  })

  if (groq.suggestions.length > 0) {
    return { tips: groq.suggestions, source: "ai" }
  }

  return { tips: staticTips, source: "static" }
}

export function serializeSparkyContext(
  ctx: HelpAssistantContext,
  settings?: SparkyAISettings
): Record<string, unknown> {
  return {
    pathname: ctx.pathname,
    routeKey: resolveHelpRouteKey(ctx.pathname, ctx.settingsSection),
    visualAppearance: ctx.visualAppearance,
    experienceObjective: ctx.experienceObjective,
    isBothMode: ctx.isBothMode,
    isSocialMode: ctx.isSocialMode,
    isDatingNav: ctx.isDatingNav,
    layoutFlags: ctx.layoutFlags,
    useProfile: settings?.useProfileForSuggestions ?? true,
    useLocationApprox: settings?.useLocationApproximation ?? true,
  }
}

export async function generateProfileSuggestions(
  viewer: Partial<UserProfile>,
  settings: SparkyAISettings
): Promise<SparkyAiResponse> {
  const ctx = {
    bioLength: sanitizeBio(viewer.bio)?.length ?? 0,
    photoCount: viewer.photos?.length ?? 0,
    interestCount: sanitizeInterestLabels(viewer.interests).length,
    profileCompleted: viewer.profileCompleted,
    reputation: viewer.reputation,
    city: settings.useLocationApproximation ? approximateCity(viewer.location) : undefined,
  }

  if (!settings.enabled) {
    return localFallback("Añade una bio de 1–2 líneas sobre qué planes disfrutas.", [
      "Destaca 3–5 intereses que realmente te representen.",
      "Una foto clara de rostro ayuda mucho en Discover.",
    ])
  }

  const groq = await runGroqTask("profile_improve", ctx, settings)
  if (groq.suggestions.length) return groq
  return localFallback("Te dejo tips locales mientras reconectamos.", [
    "Añade una bio de 1–2 líneas sobre qué planes disfrutas.",
    "Destaca 3–5 intereses que realmente te representen.",
    "Una foto clara de rostro ayuda mucho en Discover.",
  ])
}

export async function generateMatchExplanation(
  viewer: Partial<UserProfile>,
  target: Partial<UserProfile>,
  settings: SparkyAISettings
): Promise<SparkyAiResponse> {
  const shared = sanitizeInterestLabels(viewer.interests).filter((i) =>
    sanitizeInterestLabels(target.interests).some((t) => t.toLowerCase() === i.toLowerCase())
  )

  const ctx = {
    sharedInterests: settings.useProfileForSuggestions ? shared.slice(0, 6) : [],
    viewerInterests: settings.useProfileForSuggestions ? sanitizeInterestLabels(viewer.interests) : [],
    targetInterests: settings.useProfileForSuggestions ? sanitizeInterestLabels(target.interests) : [],
    targetBioSnippet: settings.useProfileForSuggestions ? sanitizeBio(target.bio, 80) : undefined,
    compatibilityHint: target.compatibilityScore ?? viewer.compatibilityScore,
  }

  const staticParts = shared.length
    ? [`Parece que comparten: ${shared.slice(0, 3).join(", ")}.`]
    : ["Según lo disponible, podrían conectar por actividad en eventos o Discover."]
  staticParts.push("Podrías empezar preguntando por un plan o evento cercano.")

  if (!settings.enabled) {
    return { suggestions: filterAiSuggestions(staticParts), source: "static" }
  }

  const groq = await runGroqTask("match_explain", ctx, settings)
  if (groq.suggestions.length) return groq
  return {
    suggestions: filterAiSuggestions(staticParts),
    source: "static",
  }
}

export async function generateIcebreaker(
  targetUsername: string | undefined,
  viewer: Partial<UserProfile>,
  target: Partial<UserProfile>,
  settings: SparkyAISettings
): Promise<SparkyAiResponse> {
  const ctx = {
    otherUsername: targetUsername ?? target.nombres ?? "esta persona",
    sharedInterests: sanitizeInterestLabels(viewer.interests).filter((i) =>
      sanitizeInterestLabels(target.interests).some((t) => t.toLowerCase() === i.toLowerCase())
    ),
  }

  if (!settings.enabled) {
    return {
      suggestions: filterAiSuggestions([
        `Hola${target.nombres ? ` ${target.nombres}` : ""}, ¿qué planes disfrutas este finde?`,
        "Vi que te gustan eventos en vivo — ¿cuál fue el último al que fuiste?",
        "¿Te apetece un café en un lugar público cerca?",
      ]),
      source: "static",
    }
  }

  const groq = await callGroqAi({
    type: "icebreaker",
    otherUsername: ctx.otherUsername,
    task: "icebreaker_tones",
    sparkyContext: ctx,
  })

  if (groq.suggestions.length) {
    return { suggestions: groq.suggestions, source: "ai" }
  }
  return generateIcebreaker(targetUsername, viewer, target, { ...settings, enabled: false })
}

function buildEventFallbackLine(event: Partial<Event>, city?: string): string {
  const title = event.title ?? "este evento"
  const category = event.category ? ` (${event.category})` : ""
  const spots =
    event.maxGuests != null
      ? ` Quedan ${Math.max(0, event.maxGuests - (event.currentApprovedCount ?? 0))} spots aprox.`
      : ""
  const free = event.free ? " Es gratuito." : ""
  return `Este meetup "${title}"${category} podría encajar si buscas algo social y relajado en ${city ?? "tu zona"}.${spots}${free}`.trim()
}

export async function generateEventRecommendation(
  event: Partial<Event>,
  userInterests: string[],
  settings: SparkyAISettings
): Promise<SparkyAiResponse> {
  const loc = stripPreciseLocation({ location: event.officialAddress ?? event.sharedAddress })
  const city = settings.useLocationApproximation
    ? loc.city ?? approximateCity(event.officialAddress ?? event.zone)
    : undefined
  const ctx = {
    title: event.title?.slice(0, 80),
    category: event.category,
    tags: event.category ? [event.category] : [],
    eventType: "meetup",
    city,
    attendeesCount: event.currentApprovedCount,
    capacity: event.maxGuests,
    spotsLeft:
      event.maxGuests != null
        ? Math.max(0, event.maxGuests - (event.currentApprovedCount ?? 0))
        : undefined,
    userInterests: settings.useProfileForSuggestions ? userInterests.slice(0, 8) : [],
  }

  if (!settings.enabled) {
    return {
      suggestions: filterAiSuggestions([buildEventFallbackLine(event, city)]),
      source: "static",
    }
  }

  const groq = await runGroqTask("event_recommend", ctx, settings)
  if (groq.suggestions.length) return groq
  return {
    suggestions: filterAiSuggestions([buildEventFallbackLine(event, city)]),
    source: "static",
  }
}

export async function generateAppearanceRecommendation(
  ctx: HelpAssistantContext,
  settings: SparkyAISettings
): Promise<SparkyAiResponse> {
  const local = buildLocalAppearanceRecommendation(ctx)
  const payload = serializeSparkyContext(ctx, settings)

  if (!settings.enabled) {
    return {
      suggestions: filterAiSuggestions([local.explanation]),
      source: "static",
      appearancePatch: {
        skin: local.skin,
        palette: local.palette,
        navbarStyle: local.navbarStyle,
      },
    }
  }

  const groq = await runGroqTask("appearance_recommend", payload, settings)
  if (groq.suggestions.length) {
    return {
      ...groq,
      appearancePatch: {
        skin: local.skin,
        palette: local.palette,
        navbarStyle: local.navbarStyle,
      },
    }
  }
  return {
    suggestions: filterAiSuggestions([local.explanation]),
    source: "static",
    appearancePatch: {
      skin: local.skin,
      palette: local.palette,
      navbarStyle: local.navbarStyle,
    },
  }
}

const CONVERSATION_REPLY_LABELS = ["Casual", "Divertida", "Coqueta respetuosa"] as const

function localConversationReplies(otherUsername?: string): SparkyAiResponse {
  const name = otherUsername ? ` ${otherUsername}` : ""
  return {
    suggestions: filterAiSuggestions([
      `¡Hola${name}! ¿Qué planes tienes este fin de semana?`,
      "Jaja, buen punto 😄 ¿y tú qué sueles hacer los sábados?",
      "Suena bien. ¿Te va un café en un lugar público cerca?",
    ]),
    suggestionLabels: [...CONVERSATION_REPLY_LABELS],
    source: "static",
  }
}

export async function generateConversationReplySuggestions(
  otherUsername: string | undefined,
  lastMessages: Array<{ content?: string }> | undefined,
  settings: SparkyAISettings,
  options?: { useContext?: boolean }
): Promise<SparkyAiResponse> {
  const allowed = options?.useContext ?? settings.useConversationContext
  const msgs = redactConversationMessages(lastMessages, allowed, 3)

  if (!settings.enabled) {
    return localConversationReplies(otherUsername)
  }

  const groq = await callGroqAi({
    type: "suggestions",
    otherUsername,
    lastMessages: msgs.map((content) => ({ content })),
    task: "conversation_replies",
    sparkyContext: { otherUsername, messageCount: msgs.length, contextUsed: allowed },
  })

  if (groq.suggestions.length) {
    const labeled = groq.suggestions.slice(0, 3)
    return {
      suggestions: labeled,
      suggestionLabels: CONVERSATION_REPLY_LABELS.slice(0, labeled.length),
      source: groq.source === "fallback" ? "static" : "ai",
      error: groq.error,
    }
  }
  return localConversationReplies(otherUsername)
}

export async function generateDatingActionTip(
  viewer: Partial<UserProfile>,
  target: Partial<UserProfile>,
  settings: SparkyAISettings
): Promise<SparkyAiResponse> {
  const shared = sanitizeInterestLabels(viewer.interests).filter((i) =>
    sanitizeInterestLabels(target.interests).some((t) => t.toLowerCase() === i.toLowerCase())
  )
  const ctx = {
    sharedInterests: settings.useProfileForSuggestions ? shared.slice(0, 6) : [],
    compatibilityHint: target.compatibilityScore,
    targetBioSnippet: settings.useProfileForSuggestions ? sanitizeBio(target.bio, 80) : undefined,
  }

  if (!settings.enabled) {
    return localDatingActionTips(viewer, target)
  }

  const groq = await runGroqTask("dating_action_tip", ctx, settings)
  if (groq.suggestions.length) {
    const suggestions = dedupeSuggestions(groq.suggestions).slice(0, 3)
    return {
      suggestions,
      suggestionLabels: DATING_TIP_LABELS.slice(0, suggestions.length),
      source: groq.source,
      error: groq.error,
    }
  }
  return localDatingActionTips(viewer, target)
}

export async function generateSafetyAwareDatingTip(settings: SparkyAISettings): Promise<SparkyAiResponse> {
  if (!settings.safetyMode) {
    return { suggestions: [], source: "static" }
  }

  if (!settings.enabled) {
    return {
      suggestions: [
        "Tip: para primeras citas, elige lugares públicos y avisa a alguien de confianza.",
      ],
      source: "static",
    }
  }

  return runGroqTask("safety_tip", {}, settings)
}
