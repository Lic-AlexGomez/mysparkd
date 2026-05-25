import type { HelpRouteKey } from "@/lib/help-assistant"
import { SPARKY_COPY } from "@/lib/sparky-copy"

export type SparkyContextAction = {
  id: string
  label: string
  command: string
  panelTitle?: string
}

function discoverActions(): SparkyContextAction[] {
  return [
    { id: "vibe", label: "¿Qué vibra ves?", command: "qué vibra ves aquí", panelTitle: SPARKY_COPY.panelTitles.matchVibe },
    { id: "phrase", label: "Dame una frase", command: "dame un icebreaker", panelTitle: SPARKY_COPY.panelTitles.icebreaker },
    { id: "spark-tip", label: "¿Spark o like?", command: "qué haría sparky", panelTitle: SPARKY_COPY.panelTitles.datingTip },
  ]
}

function eventsActions(): SparkyContextAction[] {
  return [
    { id: "which-event", label: "¿A cuál voy?", command: "recomiéndame un evento", panelTitle: SPARKY_COPY.panelTitles.event },
    { id: "explain-event", label: "Explícame este", command: "explícame este evento" },
    { id: "social-plan", label: "Plan social", command: "busca algo divertido cerca" },
  ]
}

function profileActions(): SparkyContextAction[] {
  return [
    { id: "shine", label: "Hazme brillar", command: "mejora mi perfil", panelTitle: SPARKY_COPY.panelTitles.profile },
    { id: "bio", label: "Mejora mi bio", command: "mejora mi bio" },
    { id: "missing", label: "¿Qué falta?", command: "qué le falta a mi perfil" },
  ]
}

function appearanceActions(): SparkyContextAction[] {
  return [
    { id: "pick-look", label: "Elige mi look", command: "elige un look para mí", panelTitle: SPARKY_COPY.panelTitles.look },
    { id: "more-neon", label: "Más neón", command: "pon algo más neón" },
    { id: "elegant", label: "Algo elegante", command: "algo más elegante" },
  ]
}

function chatActions(): SparkyContextAction[] {
  return [
    { id: "reply", label: "Ayúdame a responder", command: "ayúdame a responder", panelTitle: SPARKY_COPY.panelTitles.chatReply },
    { id: "casual", label: "Más casual", command: "hazlo más casual" },
    { id: "funny", label: "Más divertido", command: "hazlo más divertido" },
  ]
}

function defaultActions(): SparkyContextAction[] {
  return [
    { id: "screen", label: "¿Qué hay aquí?", command: "explícame esta pantalla" },
    { id: "event", label: "Un evento", command: "recomiéndame un evento", panelTitle: SPARKY_COPY.panelTitles.event },
    { id: "profile", label: "Mi perfil", command: "mejora mi perfil", panelTitle: SPARKY_COPY.panelTitles.profile },
  ]
}

export function getSparkyContextActions(routeKey: HelpRouteKey | null): SparkyContextAction[] {
  switch (routeKey) {
    case "discover":
      return discoverActions()
    case "events":
      return eventsActions()
    case "profile":
      return profileActions()
    case "settings-appearance":
      return appearanceActions()
    case "chat":
      return chatActions()
    default:
      return defaultActions()
  }
}

export function findContextAction(
  routeKey: HelpRouteKey | null,
  actionId: string
): SparkyContextAction | undefined {
  return getSparkyContextActions(routeKey).find((a) => a.id === actionId)
}
