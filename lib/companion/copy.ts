import type { CompanionEvent } from "@/lib/companion/context-signals"

const COPY: Record<CompanionEvent, string[]> = {
  app_open: ["hola otra vez 👀", "aquí sigo", "…👀"],
  app_background: [],
  user_idle: ["zzz…", "llevo esperando rato 😴", "modo siesta"],
  user_return_after_days: ["Ohhh volviste 😭", "Te extrañé un poquito.", "Bienvenido de vuelta."],
  user_return_long_absence: [
    "Pensé que me habías abandonado 😭",
    "Volviste… casi apago mi chispa.",
    "Ey, hacía tiempo. Me alegra verte.",
  ],
  success: ["¡Sí! Buen paso.", "Eso merece chispas.", "LET'S GOOO 🎉"],
  error: ["Creo que rompimos algo…", "Ups, eso no salió bien.", "Hmm, algo falló."],
  loading_slow: ["hmmm 👀", "déjame ver…", "ya casi ✨"],
  rage_click: ["Tranqui, respiro contigo.", "Okay… esa estuvo intensa.", "Te escucho."],
  new_message: ["Hay movimiento por aquí.", "Alguien escribió."],
  achievement: ["¡Eso sí cuenta!", "Logro desbloqueado en mi libro.", "Bravo."],
  tour_complete: ["¡Tour listo! Ya conoces el mapa.", "Buen recorrido."],
  scroll_fast: ["Vas con todo.", "Explorando a toda velocidad."],
}

export function pickCompanionCopy(event: CompanionEvent, seed = Date.now()): string | null {
  const lines = COPY[event]
  if (!lines?.length) return null
  return lines[seed % lines.length] ?? lines[0]
}

export function shouldShowProactiveCopy(
  settings: { enabled?: boolean; sparkyMode?: string },
  engagementTier: "withdrawn" | "bonded" | "neutral" = "bonded"
): boolean {
  if (settings.enabled === false) return false
  if (settings.sparkyMode === "quiet") return false
  if (engagementTier === "withdrawn") return false
  const mode = settings.sparkyMode ?? "companion"
  if (mode === "coach" || mode === "chispa" || mode === "guardian") return true
  return mode === "companion"
}
