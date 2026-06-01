import { stableDaySeed } from "@/lib/sparky-line-pacing"

export const SPARKY_ALIVE = {
  idle: ["me quedo cerquita", "aqui estoy contigo", "volviste"],
  curious: ["que tienes en mente?", "cuentame eso", "mmm, ven"],
  happy: ["me alegra verte", "eso se siente bonito", "me gusta tu energia"],
  sleepy: ["me quedo aqui tranquilito", "zzz... pero te escucho", "rinconcito en calma"],
  excited: ["vamos juntos", "eso estuvo precioso", "otra vez"],
  thinking: ["dejame pensarlo", "un segundo, lo miro contigo", "ya casi", "pensando..."],
  sad: ["uff...", "ven, respiremos"],
  scared: ["estoy aqui", "tranqui"],
  chatPlaceholder: "susurrame algo...",
  homeTitle: "Mi rinconcito",
  changeForm: "Cambiar forma",
  bond: (points: number) => `Chispa ${Math.min(100, Math.max(0, points))}/100`,
} as const

export function pickAliveLine(mood: string, seed?: number): string {
  const stableSeed = seed ?? stableDaySeed(mood)
  const map: Record<string, readonly string[]> = {
    idle: SPARKY_ALIVE.idle,
    happy: SPARKY_ALIVE.happy,
    curious: SPARKY_ALIVE.curious,
    sleepy: SPARKY_ALIVE.sleepy,
    excited: SPARKY_ALIVE.excited,
    celebrating: SPARKY_ALIVE.excited,
    thinking: SPARKY_ALIVE.thinking,
    confused: SPARKY_ALIVE.thinking,
    sad: SPARKY_ALIVE.sad,
    scared: SPARKY_ALIVE.scared,
  }
  const lines = map[mood] ?? SPARKY_ALIVE.idle
  return lines[stableSeed % lines.length] ?? lines[0]
}
