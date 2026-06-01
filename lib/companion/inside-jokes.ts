import type { RelationshipLevel } from "@/lib/companion/vibe-engine"
import type { SparkyMemory } from "@/lib/sparky-memory"
import { pickVocabularyLine } from "@/lib/companion/vocabulary"

type JokeRule = {
  id: string
  unlockWhen: (memory: SparkyMemory) => boolean
  nickname: string
  category: "sleep_nudge" | "grind_tease" | "comeback_tease"
}

const RULES: JokeRule[] = [
  {
    id: "night_owl",
    unlockWhen: (memory) => (memory.activeHoursHistogram?.night ?? 0) >= 5,
    nickname: "CEO del insomnio",
    category: "sleep_nudge",
  },
  {
    id: "grind_mode",
    unlockWhen: (memory) => (memory.avgSessionMinutes ?? 0) >= 35,
    nickname: "máquina de trabajar",
    category: "grind_tease",
  },
  {
    id: "ghost_mode",
    unlockWhen: (memory) => Boolean(memory.lastOpenDay),
    nickname: "fantasma corporativo",
    category: "comeback_tease",
  },
]

export function updateInsideJokes(memory: SparkyMemory, now = new Date()): SparkyMemory {
  const unlocked = new Set(memory.insideJokesUnlocked ?? [])
  for (const rule of RULES) {
    if (rule.unlockWhen(memory)) unlocked.add(rule.id)
  }
  const next = { ...memory, insideJokesUnlocked: [...unlocked].slice(-24) }
  if (!next.activeNickname && unlocked.has("night_owl")) {
    next.activeNickname = { id: "night_owl", label: "CEO del insomnio", setAt: now.toISOString() }
  }
  return next
}

export function pickInsideJokeLine(opts: {
  memory: SparkyMemory
  relationshipLevel: RelationshipLevel
  seed?: number
}): { line: string; jokeId: string } | null {
  const unlocked = new Set(opts.memory.insideJokesUnlocked ?? [])
  const available = RULES.filter((rule) => unlocked.has(rule.id))
  if (!available.length) return null
  const seed = Math.abs(Math.round(opts.seed ?? Date.now()))
  const chosen = available[seed % available.length]
  if (!chosen) return null
  return {
    line: pickVocabularyLine({
      category: chosen.category,
      relationshipLevel: opts.relationshipLevel,
      archetype: opts.memory.archetype,
      seed,
    }),
    jokeId: chosen.id,
  }
}

