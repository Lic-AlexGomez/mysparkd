import type { RelationshipLevel } from "@/lib/companion/vibe-engine"
import type { SparkyArchetype } from "@/lib/sparky-memory"
import { normalizeLineKey } from "@/lib/companion/repetition-guard"

export type VocabCategory =
  | "greeting"
  | "sleep_nudge"
  | "grind_tease"
  | "comeback_tease"
  | "celebrate_small"
  | "idle_comment"

type Pools = Record<RelationshipLevel, string[]>

const ROOMIE_POOLS: Record<VocabCategory, Pools> = {
  greeting: {
    stranger: ["hola 👋", "hey, aquí ando"],
    buddy: ["otra vez por aquí eh 👀", "ey bro, volvimos"],
    closeFriend: ["literal siempre coincidimos aquí", "ya llegaste, nice"],
    bestie: ["tú y yo ya pagamos renta aquí", "volviste, mi socio digital"],
  },
  sleep_nudge: {
    stranger: ["ya es tarde, cuídate", "si puedes, descansa un poco"],
    buddy: ["bro ya toca dormir 😭", "otra noche larga? suave con eso"],
    closeFriend: ["otra vez tarde, leyenda", "modo nocturno activado otra vez"],
    bestie: ["CEO del sueño roto reporting in", "bestie, cama. ahora."],
  },
  grind_tease: {
    stranger: ["andas constante hoy", "se ve que estás enfocado"],
    buddy: ["andas en modo grind 👀", "ok, hoy vienes fuerte"],
    closeFriend: ["máquina de trabajar oficialmente activa", "hoy sí estás cocinando"],
    bestie: ["te firmaste otro turno contigo mismo", "trabajólico pero cute"],
  },
  comeback_tease: {
    stranger: ["qué bueno verte otra vez", "bienvenido de vuelta"],
    buddy: ["pensé que te habías ido a marte", "volvió el personaje"],
    closeFriend: ["fantasma corporativo detectado", "te extrañó el caos de aquí"],
    bestie: ["regresó mi roommate perdido", "ok, ya era hora de volver"],
  },
  celebrate_small: {
    stranger: ["bien ahí", "vamos bien"],
    buddy: ["ok eso estuvo bien 🔥", "esa jugada estuvo clean"],
    closeFriend: ["hoy sí andas imparable", "te salió redondo, eh"],
    bestie: ["te luciste feo", "bestie en modo MVP"],
  },
  idle_comment: {
    stranger: ["por si acaso 👀", "modo espera", "te leo en silencio"],
    buddy: ["yo aquí en chill", "ando vigilando tranqui", "nada urgente, solo paso"],
    closeFriend: ["modo roommate silencioso", "yo aquí haciendo guardia casual", "sin drama, solo vibes"],
    bestie: ["en silencio pero presente", "respirando contigo en lowkey", "tu sombra digital favorita"],
  },
}

export function pickVocabularyLine(opts: {
  category: VocabCategory
  relationshipLevel: RelationshipLevel
  archetype?: SparkyArchetype
  seed?: number
  excludeLineKeys?: string[]
}): string {
  const lines = ROOMIE_POOLS[opts.category][opts.relationshipLevel]
  const excluded = new Set(opts.excludeLineKeys ?? [])
  const pool = lines.filter((line) => !excluded.has(normalizeLineKey(line)))
  const candidates = pool.length > 0 ? pool : lines
  const seed = Math.abs(Math.round(opts.seed ?? Date.now()))
  return candidates[seed % Math.max(1, candidates.length)] ?? candidates[0] ?? "aquí ando"
}

