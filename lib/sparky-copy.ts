/** Copy oficial de Sparky — mascota, no asistente de IA. */

export const SPARKY_COPY = {
  name: "Sparky",
  tagline: "Tu chispa en Sparkd",
  pocketTitle: "La casita de Sparky",
  pocketSubtitle: "Compañero de Sparkd",

  greetings: [
    "Ey, qué bueno verte ✨",
    "Listo para encender algo hoy?",
    "Hoy podemos hacerlo simple.",
  ],
  celebrations: [
    "¡Chispa detectada!",
    "Eso tuvo buena vibra.",
    "Ok, eso salió bien.",
  ],
  support: [
    "Tranqui, vamos paso a paso.",
    "Puedo ayudarte con eso.",
    "Te doy una opción simple.",
  ],
  playful: [
    "Modo glow activado.",
    "Eso sí tiene estilo.",
    "Tengo una idea.",
  ],
  safety: [
    "Primera vez? Mejor lugar público y cero presión.",
    "Si algo se siente raro, puedes reportar o bloquear.",
    "La buena vibra también respeta límites.",
  ],
  appearance: [
    "Este look te queda más social.",
    "Ese neón sí llama la atención.",
    "Vamos con algo más elegante.",
  ],
  matching: [
    "Veo intereses en común.",
    "Podría haber buena conversación aquí.",
    "Si te llama la atención, Spark tiene sentido.",
  ],
  events: [
    "Este plan se ve social sin ser intenso.",
    "Buen evento para romper la rutina.",
    "Aquí hay movimiento.",
  ],

  panelTitles: {
    matchVibe: "¿Qué vibra ves?",
    icebreaker: "Sparky, dame una frase",
    profile: "Hazme brillar",
    event: "Sparky, ¿a cuál voy?",
    look: "Elige mi look",
    chatReply: "Ayúdame a responder",
    datingTip: "¿Spark o like?",
    thinking: "Sparky está pensando…",
  },

  settings: {
    section: "Sparky",
    enable: "Sparky vive aquí",
    enableSub: "Tu compañero en Sparkd",
    smartFeatures: "Funciones inteligentes",
    smartFeaturesSub: "Sugerencias más elaboradas (opcional)",
    smartEnable: "Dejar que Sparky te sugiera cosas",
    voice: "Hablar con Sparky",
    voiceSub: "Sparky escucha solo cuando lo mantienes pulsado",
    voicePrivacy: "Sparky no escucha hasta que lo llamas.",
    memory: "Lo que Sparky recuerda",
    modeCompanion: "Companion — mascota",
    modeCoach: "Coach — más tips",
    modeQuiet: "Quiet — casi invisible",
  },
} as const

export type SparkyCopyCategory = keyof Pick<
  typeof SPARKY_COPY,
  | "greetings"
  | "celebrations"
  | "support"
  | "playful"
  | "safety"
  | "appearance"
  | "matching"
  | "events"
>

export function pickSparkyCopy(category: SparkyCopyCategory, seed = Date.now()): string {
  const list = SPARKY_COPY[category]
  return list[seed % list.length] ?? list[0]
}
