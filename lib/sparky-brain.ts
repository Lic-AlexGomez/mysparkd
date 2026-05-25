import type { HelpRouteKey } from "@/lib/help-assistant"
import { resolveHelpRouteKey } from "@/lib/help-assistant"
import { pickHelpPhrase, pickSparkyPhrase } from "@/lib/sparky-personality"
import type { SparkyMemory } from "@/lib/sparky-memory"
import { memoryGreeting } from "@/lib/sparky-memory"

export type SparkyBrainContext = {
  pathname: string
  routeKey: HelpRouteKey | null
  memory?: SparkyMemory
  userDisplayName?: string
}

export type SparkyIntent =
  | { type: "navigate"; route: string; reply?: string }
  | { type: "explain_screen"; reply?: string }
  | { type: "explain_match"; targetUserId?: string; reply?: string }
  | { type: "generate_icebreaker"; targetUserId?: string; reply?: string }
  | { type: "recommend_event"; eventId?: string; reply?: string }
  | { type: "improve_profile"; reply?: string }
  | { type: "recommend_appearance"; reply?: string }
  | { type: "apply_appearance"; skin?: string; palette?: string; navbarStyle?: string; reply?: string }
  | { type: "chat_reply_help"; reply?: string }
  | { type: "dating_tip"; reply?: string }
  | { type: "safety_tip"; reply?: string }
  | { type: "start_tour"; reply?: string }
  | { type: "open_command_help"; reply?: string }
  | { type: "open_settings"; section?: string; reply?: string }
  | { type: "unknown"; fallbackMessage: string }

function norm(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w))
}

export function parseSparkyIntent(input: string, ctx: SparkyBrainContext): SparkyIntent {
  const text = norm(input)
  const greet = memoryGreeting(ctx.memory ?? {}) ?? ""

  if (!text) {
    return { type: "unknown", fallbackMessage: `${greet}¿En qué te ayudo?` }
  }

  if (hasAny(text, ["ayuda", "que puedo", "qué puedo", "comandos"])) {
    return {
      type: "open_command_help",
      reply: `${greet}Puedo navegar, explicar pantallas, matches, eventos, perfil y apariencia.`,
    }
  }

  if (hasAny(text, ["tour", "recorrido", "onboarding"])) {
    return { type: "start_tour", reply: "¡Vamos con el tour!" }
  }

  if (hasAny(text, ["evento", "eventos", "meetup", "plan"])) {
    if (hasAny(text, ["recomienda", "sugiere", "cual", "cuál", "mejor"])) {
      return { type: "recommend_event", reply: "Miro qué evento podría encajarte." }
    }
    if (hasAny(text, ["lleva", "abre", "ir"])) {
      return { type: "navigate", route: "/(main)/(tabs)/events", reply: "Te llevo a Eventos." }
    }
  }

  if (hasAny(text, ["perfil", "bio", "fotos"])) {
    if (hasAny(text, ["mejora", "mejorar", "falta", "arregla"])) {
      return { type: "improve_profile", reply: "Revisemos tu perfil." }
    }
    if (hasAny(text, ["abre", "mi perfil"])) {
      return { type: "navigate", route: "/(main)/(tabs)/profile", reply: "Abriendo tu perfil." }
    }
  }

  if (hasAny(text, ["match", "compatib", "en comun", "en común", "por que", "por qué"])) {
    return { type: "explain_match", reply: "Te explico este match." }
  }

  if (hasAny(text, ["icebreaker", "hielo", "primer mensaje", "que le digo", "qué le digo"])) {
    return { type: "generate_icebreaker", reply: "Te preparo frases para romper el hielo." }
  }

  if (hasAny(text, ["responder", "respuesta", "contestar", "chat", "mensaje"])) {
    return { type: "chat_reply_help", reply: "Te sugiero respuestas respetuosas." }
  }

  if (hasAny(text, ["spark", "like", "descartar", "consejo", "que harias", "qué harías"])) {
    return { type: "dating_tip", reply: pickSparkyPhrase("supportive") }
  }

  if (hasAny(text, ["tema", "look", "apariencia", "skin", "navbar", "neón", "neon", "oscuro"])) {
    if (hasAny(text, ["aplica", "pon", "cambia navbar", "dock"])) {
      return { type: "recommend_appearance", reply: "Te sugiero un look y puedes aplicarlo." }
    }
    return { type: "recommend_appearance", reply: "Elige un look conmigo en Apariencia o aquí." }
  }

  if (hasAny(text, ["feed", "inicio", "muro"])) {
    return { type: "navigate", route: "/(main)/(tabs)/feed", reply: "Al feed." }
  }
  if (hasAny(text, ["discover", "swipe", "swipes", "citas"])) {
    return { type: "navigate", route: "/(main)/(tabs)/swipes", reply: "A Discover." }
  }
  if (hasAny(text, ["ajustes", "settings", "config"])) {
    return { type: "open_settings", reply: "Abro Ajustes." }
  }

  if (hasAny(text, ["pantalla", "explica", "explicame", "explícame", "aqui", "aquí"])) {
    return { type: "explain_screen", reply: pickHelpPhrase() }
  }

  if (hasAny(text, ["seguridad", "cita", "seguro"])) {
    return { type: "safety_tip", reply: pickSparkyPhrase("safety") }
  }

  return {
    type: "unknown",
    fallbackMessage: `${greet}No entendí del todo. Prueba: "explícame esta pantalla", "recomiéndame un evento" o "mejora mi perfil".`,
  }
}

export type SparkyIntentHandlers = {
  explainScreen?: () => void
  explainMatch?: () => void
  generateIcebreaker?: () => void
  recommendEvent?: () => void
  improveProfile?: () => void
  recommendAppearance?: () => void
  chatReplyHelp?: () => void
  datingTip?: () => void
  startTour?: () => void
  openSettings?: (section?: string) => void
  navigate?: (route: string) => void
  showMessage?: (text: string) => void
}

export async function executeSparkyIntent(
  intent: SparkyIntent,
  handlers: SparkyIntentHandlers
): Promise<{ handled: boolean; message?: string }> {
  switch (intent.type) {
    case "navigate":
      handlers.navigate?.(intent.route)
      return { handled: true, message: intent.reply }
    case "open_settings":
      handlers.openSettings?.(intent.section)
      return { handled: true, message: intent.reply }
    case "explain_screen":
      handlers.explainScreen?.()
      return { handled: true, message: intent.reply }
    case "explain_match":
      handlers.explainMatch?.()
      return { handled: true, message: intent.reply }
    case "generate_icebreaker":
      handlers.generateIcebreaker?.()
      return { handled: true, message: intent.reply }
    case "recommend_event":
      handlers.recommendEvent?.()
      return { handled: true, message: intent.reply }
    case "improve_profile":
      handlers.improveProfile?.()
      return { handled: true, message: intent.reply }
    case "recommend_appearance":
      handlers.recommendAppearance?.()
      return { handled: true, message: intent.reply }
    case "chat_reply_help":
      handlers.chatReplyHelp?.()
      return { handled: true, message: intent.reply }
    case "dating_tip":
      handlers.datingTip?.()
      return { handled: true, message: intent.reply }
    case "safety_tip":
      handlers.showMessage?.(intent.reply ?? pickSparkyPhrase("safety"))
      return { handled: true, message: intent.reply }
    case "start_tour":
      handlers.startTour?.()
      return { handled: true, message: intent.reply }
    case "open_command_help":
      handlers.showMessage?.(intent.reply ?? pickHelpPhrase())
      return { handled: true, message: intent.reply }
    case "unknown":
      handlers.showMessage?.(intent.fallbackMessage)
      return { handled: false, message: intent.fallbackMessage }
    default:
      return { handled: false }
  }
}

export function buildBrainContext(pathname: string, settingsSection?: string | null): SparkyBrainContext {
  return {
    pathname,
    routeKey: resolveHelpRouteKey(pathname, settingsSection),
  }
}
