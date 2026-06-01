import type { SparkyMemory } from "@/lib/sparky-memory"
import { relationshipLevelFromBondPoints } from "@/lib/companion/vibe-engine"

export type InteractionStyle = "fast" | "calm" | "mixed"

export type TraitState = {
  confidence: number
  humor: number
  chaos: number
  affection: number
}

export type TimeBucket = "morning" | "afternoon" | "evening" | "night"

function timeBucket(date = new Date()): TimeBucket {
  const h = date.getHours()
  if (h >= 5 && h < 12) return "morning"
  if (h >= 12 && h < 17) return "afternoon"
  if (h >= 17 && h < 22) return "evening"
  return "night"
}

function defaultTraits(memory: SparkyMemory): TraitState {
  const base = memory.traitState
  if (base) return { ...base }
  const level = memory.personalityLevel
  const humor = level === "playful" ? 65 : level === "calm" ? 40 : 55
  return { confidence: 50, humor, chaos: level === "playful" ? 60 : 35, affection: 50 }
}

/** Aprendizaje diario local — solo agregados, sin PII. */
export function processDailyAdaptiveLearning(
  memory: SparkyMemory,
  opts?: {
    sessionMinutes?: number
    tapVelocity?: "fast" | "calm"
    positiveInteraction?: boolean
    ignored?: boolean
    now?: Date
  }
): SparkyMemory {
  const now = opts?.now ?? new Date()
  const day = now.toISOString().slice(0, 10)
  if (memory.lastProcessedDay === day) return memory

  const bucket = timeBucket(now)
  const histogram = { ...(memory.activeHoursHistogram ?? {}) }
  histogram[bucket] = (histogram[bucket] ?? 0) + 1

  let interactionStyle: InteractionStyle = memory.interactionStyle ?? "mixed"
  if (opts?.tapVelocity === "fast") interactionStyle = interactionStyle === "calm" ? "mixed" : "fast"
  else if (opts?.tapVelocity === "calm") interactionStyle = interactionStyle === "fast" ? "mixed" : "calm"

  const prevMinutes = memory.avgSessionMinutes ?? 0
  const sessionMinutes = opts?.sessionMinutes ?? prevMinutes
  const avgSessionMinutes =
    prevMinutes > 0 ? Math.round((prevMinutes + sessionMinutes) / 2) : Math.round(sessionMinutes)

  const traits = defaultTraits(memory)
  let { confidence, humor, chaos, affection } = traits
  if (opts?.positiveInteraction) {
    affection = Math.min(100, affection + 2)
    confidence = Math.min(100, confidence + 1)
    humor = Math.min(100, humor + 1)
  }
  if (opts?.ignored) {
    affection = Math.max(0, affection - 2)
    confidence = Math.max(0, confidence - 1)
  }

  return {
    ...memory,
    activeHoursHistogram: histogram,
    interactionStyle,
    avgSessionMinutes,
    traitState: { confidence, humor, chaos, affection },
    lastProcessedDay: day,
  }
}

export function buildCompanionVibeContext(memory: SparkyMemory): Record<string, unknown> {
  const bond = memory.bondPoints ?? 0
  const relationshipLevel = memory.relationshipLevel ?? relationshipLevelFromBondPoints(bond)
  return {
    interactionStyle: memory.interactionStyle ?? "mixed",
    avgSessionMinutes: memory.avgSessionMinutes ?? 0,
    traitState: memory.traitState,
    bondLevel: bond,
    bondScore: Math.min(100, bond),
    relationshipLevel,
    favoriteCompanion: memory.favoriteCompanion ?? "sparky",
    activeHoursHistogram: memory.activeHoursHistogram,
    archetype: memory.archetype ?? "roomie",
    activeNickname: memory.activeNickname?.label,
    insideJokesUnlocked: memory.insideJokesUnlocked ?? [],
    emotionalMomentIds: (memory.emotionalMoments ?? []).map((m) => m.id).slice(-8),
  }
}
