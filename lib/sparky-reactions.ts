import { pickSparkyCopy } from "@/lib/sparky-copy"
import type { SparkyExpression } from "@/components/sparky/sparky-types"

export type SparkyReactionEvent =
  | "theme_change"
  | "match"
  | "enter_events"
  | "idle_screen"
  | "many_dismisses"
  | "dark_mode"
  | "profile_complete"
  | "appearance_change"

export type SparkyReaction = {
  phrase?: string
  expression?: SparkyExpression
  motion?: "wink" | "bounce" | "celebrate" | "peek" | "think"
  silent?: boolean
}

const REACTIONS: Record<SparkyReactionEvent, SparkyReaction[]> = {
  theme_change: [
    { phrase: "Ok, ahora sí tenemos estilo.", expression: "wink", motion: "wink" },
    { phrase: pickSparkyCopy("appearance"), motion: "bounce" },
  ],
  match: [
    { phrase: "¡Chispa detectada!", expression: "excited", motion: "celebrate" },
    { phrase: pickSparkyCopy("celebrations"), motion: "bounce" },
  ],
  enter_events: [
    { phrase: "Aquí puede pasar algo bueno.", expression: "happy", motion: "peek" },
    { phrase: pickSparkyCopy("events"), motion: "bounce" },
  ],
  idle_screen: [
    { phrase: "¿Exploramos algo más?", expression: "thinking", motion: "think", silent: false },
    { motion: "wink", silent: true },
  ],
  many_dismisses: [
    { phrase: "Modo exigente activado 😌", expression: "thinking", motion: "think" },
  ],
  dark_mode: [
    { phrase: "Modo noche, más drama, más glow.", expression: "happy", motion: "wink" },
  ],
  profile_complete: [
    { phrase: "Ahora sí, perfil con presencia.", expression: "celebrating", motion: "celebrate" },
  ],
  appearance_change: [
    { phrase: "Uff, ese look sí tiene vibe.", expression: "wink", motion: "wink" },
  ],
}

export function getSparkyReaction(event: SparkyReactionEvent, seed = Date.now()): SparkyReaction {
  const list = REACTIONS[event]
  return list[seed % list.length] ?? list[0]
}
