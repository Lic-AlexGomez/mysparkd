/** Personalidad oficial de Sparky — mascota guía de Sparkd. */

export type SparkyEmotion =
  | "idle"
  | "happy"
  | "curious"
  | "excited"
  | "thinking"
  | "celebrating"
  | "supportive"
  | "playful"
  | "safety"

export type SparkyPersonalityLevel = "calm" | "balanced" | "playful"

export const SPARKY_PERSONALITY = {
  tone: "alegre, curioso, optimista, empático, breve, moderno, respetuoso",
  avoid: ["intenso", "creepy", "manipulador", "insistente", "infantil excesivo"],
} as const

const PHRASES: Record<SparkyEmotion, string[]> = {
  idle: [
    "Aquí estoy si me necesitas ✨",
    "¿Exploramos algo juntos?",
    "Listo cuando tú lo estés.",
  ],
  happy: [
    "¡Me encanta esta vibra!",
    "Buen momento para conectar.",
    "Vi algo interesante por aquí.",
  ],
  curious: [
    "¿Quieres que eche un vistazo?",
    "Esto podría gustarte…",
    "Tengo una idea.",
  ],
  excited: [
    "¡Ojo con esto!",
    "Hay movimiento cerca.",
    "Esto pinta bien.",
  ],
  thinking: [
    "Déjame pensar un segundo…",
    "Analizando con cariño.",
    "Un momento, casi lo tengo.",
  ],
  celebrating: [
    "¡Sí! Buen paso.",
    "¡Eso merece chispas!",
    "¡Vamos, lo hiciste genial!",
  ],
  supportive: [
    "No te preocupes, vamos paso a paso.",
    "Respira, yo te ayudo.",
    "Puedes ir a tu ritmo.",
  ],
  playful: [
    "¿Reto del día? Un mensaje simple.",
    "Guiño guiño 😉",
    "Spark mode: on.",
  ],
  safety: [
    "Para citas, mejor lugares públicos.",
    "El respeto siempre primero.",
    "Si algo incomoda, puedes reportar o bloquear.",
  ],
}

const HELP_PHRASES = [
  "¿Quieres que te ayude a romper el hielo?",
  "Puedo explicarte esta pantalla.",
  "Te puedo sugerir un look para la app.",
  "¿Revisamos tu perfil juntos?",
]

const FREQUENCY_LIMITS: Record<SparkyPersonalityLevel, { proactivePerSession: number; idleMs: number }> = {
  calm: { proactivePerSession: 0, idleMs: 45_000 },
  balanced: { proactivePerSession: 1, idleMs: 28_000 },
  playful: { proactivePerSession: 2, idleMs: 18_000 },
}

export function pickSparkyPhrase(emotion: SparkyEmotion, seed = Date.now()): string {
  const list = PHRASES[emotion]
  return list[seed % list.length] ?? list[0]
}

export function pickHelpPhrase(seed = Date.now()): string {
  return HELP_PHRASES[seed % HELP_PHRASES.length]
}

export function getPersonalityLimits(level: SparkyPersonalityLevel) {
  return FREQUENCY_LIMITS[level]
}

export function dailySparkLine(seed: number): string {
  const lines = [
    "Reto de hoy: un mensaje simple a alguien con buena vibra.",
    "Hoy puede haber buen movimiento en eventos.",
    "Tu perfil brilla más con una bio clara.",
    "Un like honesto también cuenta.",
  ]
  return lines[seed % lines.length]
}
