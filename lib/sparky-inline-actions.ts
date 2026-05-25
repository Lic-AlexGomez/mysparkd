import type { HelpRouteKey } from "@/lib/help-assistant"
import type { SparkyAnchor } from "@/lib/sparky-motion"
import { routeToContextAnchor } from "@/lib/sparky-anchors"

export type SparkyInlineActionDef = {
  id: string
  label: string
  variant?: "primary" | "secondary"
}

export type SparkyInlineTapConfig = {
  message: string
  anchor: SparkyAnchor
  actions: SparkyInlineActionDef[]
}

const INLINE_TAP: Partial<Record<HelpRouteKey, SparkyInlineTapConfig>> = {
  feed: {
    message: "¿Quieres ver qué está moviéndose por aquí?",
    anchor: "nearFeed",
    actions: [
      { id: "screen", label: "Tip rápido", variant: "primary" },
      { id: "event", label: "Un evento", variant: "secondary" },
    ],
  },
  events: {
    message: "Hay planes que podrían encajar contigo.",
    anchor: "nearEvents",
    actions: [
      { id: "which-event", label: "Recomiéndame uno", variant: "primary" },
      { id: "explain-event", label: "Explícame eventos", variant: "secondary" },
    ],
  },
  discover: {
    message: "Veo una vibra interesante aquí.",
    anchor: "nearSwipeActions",
    actions: [
      { id: "vibe", label: "¿Qué vibra ves?", variant: "primary" },
      { id: "phrase", label: "Dame una frase", variant: "secondary" },
    ],
  },
  profile: {
    message: "Tu perfil puede brillar un poco más.",
    anchor: "nearProfileStats",
    actions: [
      { id: "bio", label: "Mejorar bio", variant: "primary" },
      { id: "shine", label: "Ver stats", variant: "secondary" },
    ],
  },
  "settings-appearance": {
    message: "Podemos darle otro look a Sparkd.",
    anchor: "nearSettings",
    actions: [
      { id: "pick-look", label: "Elige por mí", variant: "primary" },
      { id: "more-neon", label: "Más neón", variant: "secondary" },
    ],
  },
  chat: {
    message: "¿Te ayudo con la respuesta?",
    anchor: "nearNavbar",
    actions: [
      { id: "reply", label: "Ayúdame", variant: "primary" },
      { id: "casual", label: "Más casual", variant: "secondary" },
    ],
  },
}

const DEFAULT_TAP: SparkyInlineTapConfig = {
  message: "¿Qué te apetece hacer?",
  anchor: "bottomRight",
  actions: [
    { id: "screen", label: "Tip rápido", variant: "primary" },
    { id: "event", label: "Un evento", variant: "secondary" },
  ],
}

export function getSparkyInlineTapConfig(routeKey: HelpRouteKey | null): SparkyInlineTapConfig {
  if (!routeKey) return DEFAULT_TAP
  return INLINE_TAP[routeKey] ?? { ...DEFAULT_TAP, anchor: routeToContextAnchor(routeKey) }
}

export const SPARKY_LONG_PRESS_HINT = "Sosténme para más opciones."

export const SPARKY_INLINE_LOADING = "Déjame mirar…"

export const SPARKY_INLINE_ERROR = "Hmm, no pude ver eso ahora. Probemos algo simple."
