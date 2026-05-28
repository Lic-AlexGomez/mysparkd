import type { RelationshipLevel } from "@/lib/companion/vibe-engine"
import type { SparkyMemory } from "@/lib/sparky-memory"
import { pickVocabularyLine } from "@/lib/companion/vocabulary"

export function updateEmotionalMoments(memory: SparkyMemory, now = new Date()): SparkyMemory {
  const moments = [...(memory.emotionalMoments ?? [])]
  const has = (id: string) => moments.some((m) => m.id === id)
  if (!has("first_all_nighter") && (memory.activeHoursHistogram?.night ?? 0) >= 1) {
    moments.push({ id: "first_all_nighter", at: now.toISOString() })
  }
  if (!has("first_major_celebration") && (memory.bondPoints ?? 0) >= 30) {
    moments.push({ id: "first_major_celebration", at: now.toISOString() })
  }
  return { ...memory, emotionalMoments: moments.slice(-40) }
}

export function pickMomentMention(opts: {
  memory: SparkyMemory
  relationshipLevel: RelationshipLevel
  seed?: number
}): { line: string; momentId: string } | null {
  const moments = opts.memory.emotionalMoments ?? []
  if (!moments.length) return null
  const seed = Math.abs(Math.round(opts.seed ?? Date.now()))
  const m = moments[seed % moments.length]
  if (!m) return null
  const category = m.id === "first_major_celebration" ? "celebrate_small" : "idle_comment"
  return {
    line: pickVocabularyLine({
      category,
      relationshipLevel: opts.relationshipLevel,
      archetype: opts.memory.archetype,
      seed,
    }),
    momentId: m.id,
  }
}

