import type { RelationshipLevel } from "@/lib/companion/vibe-engine"
import type { SparkyMemory } from "@/lib/sparky-memory"
import { applyRepetitionGuard } from "@/lib/companion/repetition-guard"
import { resolvePacingLimits, shouldAllowPacedProactive } from "@/lib/companion/presence-pacing"
import { applyLongTermProgression } from "@/lib/companion/progression"
import { updateInsideJokes } from "@/lib/companion/inside-jokes"
import { updateEmotionalMoments } from "@/lib/companion/emotional-moments"

export function publishProactiveLine(
  memory: SparkyMemory,
  opts: {
    line: string
    key: string
    relationshipLevel: RelationshipLevel
    now?: Date
    cooldownMs?: number
  }
): { allowed: boolean; memory: SparkyMemory; line: string } {
  const now = opts.now ?? new Date()
  const base = applyLongTermProgression(updateEmotionalMoments(updateInsideJokes(memory, now), now))
  if (!shouldAllowPacedProactive(base, opts.relationshipLevel, now)) {
    return { allowed: false, memory: base, line: opts.line }
  }
  const limits = resolvePacingLimits(base, opts.relationshipLevel)
  const guard = applyRepetitionGuard(base, {
    key: opts.key,
    line: opts.line,
    now,
    cooldownMs: opts.cooldownMs ?? 60_000,
    maxPerHour: limits.maxPerHour,
    maxMentionsPerDay: limits.maxPerDay,
  })
  if (!guard.allowed) return { allowed: false, memory: guard.memory, line: opts.line }
  return {
    allowed: true,
    memory: applyLongTermProgression({ ...guard.memory, relationshipLevel: opts.relationshipLevel }),
    line: opts.line,
  }
}
