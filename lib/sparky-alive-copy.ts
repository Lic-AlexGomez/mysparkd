export const SPARKY_ALIVE = {
  idle: ["hola otra vez 👀", "aquí sigo", "…👀"],
  curious: ["¿qué hacemos hoy?", "eso qué es", "mmm interesante"],
  happy: ["esto se ve divertido ✨", "sí sí sí", "me gusta esto"],
  sleepy: ["llevo esperando rato 😴", "zzz casi", "modo siesta"],
  excited: ["¡vamos!", "eso estuvo bien 🔥", "otra vez"],
  thinking: ["hmmm 👀", "déjame ver…", "ya casi ✨", "pensando…"],
  sad: ["uff…", "snif"],
  scared: ["eep", "cuidado"],
  chatPlaceholder: "susúrrame algo…",
  homeTitle: "mi rinconcito",
  changeForm: "Cambiar forma",
  bond: (points: number) => `chispa ${points}/100`,
} as const

export function pickAliveLine(
  mood: string,
  seed = Date.now()
): string {
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
  return lines[seed % lines.length] ?? lines[0]
}
