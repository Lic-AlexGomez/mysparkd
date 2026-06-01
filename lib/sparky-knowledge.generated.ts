export type SparkyRouteKey =
  | "feed"
  | "events"
  | "discover"
  | "profile"
  | "chat"
  | "notifications"
  | "settings"
  | "unknown"

const KB: Record<SparkyRouteKey, string> = {
  feed: [
    "Estás en Feed.",
    "Aquí puedes ver publicaciones, dar like, comentar y guardar.",
    "Si buscas algo específico, usa Buscar o ve a Eventos para planes.",
  ].join("\n"),
  events: [
    "Estás en Eventos.",
    "Aquí puedes descubrir planes, ver detalles y unirte.",
    "Si hay invitaciones pendientes, revísalas en Notificaciones > Pendientes.",
  ].join("\n"),
  discover: [
    "Estás en Discover (Swipes).",
    "Puedes dar Like/Spark según la experiencia; usa Spark cuando de verdad te llamó la atención.",
    "Si dudas, like normal está bien. Sin presión.",
  ].join("\n"),
  profile: [
    "Estás en Perfil.",
    "Mejoras rápidas: bio clara, 3+ fotos, intereses completos.",
    "Si alguien te sigue, verás “Seguir de vuelta”.",
  ].join("\n"),
  chat: [
    "Estás en Chat.",
    "Puedo sugerir un icebreaker o 3 respuestas cortas.",
    "Para coordinar planes: pregunta hora, sugiere lugar y confirma detalles.",
  ].join("\n"),
  notifications: [
    "Estás en Notificaciones.",
    "Aquí aparecen actividad, solicitudes pendientes e invitaciones.",
    "Si hay acciones (aceptar/rechazar), suelen estar en Pendientes.",
  ].join("\n"),
  settings: [
    "Estás en Ajustes.",
    "Aquí puedes cambiar experiencia, apariencia y preferencias de Sparky (modo, IA, voz).",
    "Si quieres menos avisos, activa modo silencioso o quiet hours.",
  ].join("\n"),
  unknown: [
    "Puedo ayudarte a navegar la app y explicarte esta pantalla.",
    "Dime qué intentas hacer y te doy pasos concretos.",
  ].join("\n"),
}

export function resolveSparkyRouteKey(input: unknown): SparkyRouteKey {
  if (typeof input !== "string") return "unknown"
  const key = input.trim()
  if (key === "feed") return "feed"
  if (key === "events") return "events"
  if (key === "discover") return "discover"
  if (key === "profile") return "profile"
  if (key === "chat") return "chat"
  if (key === "notifications") return "notifications"
  if (key === "settings") return "settings"
  return "unknown"
}

export function getSparkyKnowledgeForRoute(routeKey: unknown): string {
  const key = resolveSparkyRouteKey(routeKey)
  return KB[key]
}

