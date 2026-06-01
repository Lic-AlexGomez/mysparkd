import type { RelationshipLevel } from "@/lib/companion/vibe-engine"
import type { SparkyMemory } from "@/lib/sparky-memory"

function inQuietHours(memory: SparkyMemory, now: Date): boolean {
  const quiet = memory.pacing?.quietHours
  if (!quiet) return false
  const mins = now.getHours() * 60 + now.getMinutes()
  const start = quiet.start * 60
  const end = quiet.end * 60
  if (start <= end) return mins >= start && mins < end
  return mins >= start || mins < end
}

function relationBudget(level: RelationshipLevel): number {
  if (level === "bestie") return 3
  if (level === "closeFriend") return 2
  return 1
}

export function resolvePacingLimits(
  memory: SparkyMemory,
  relationshipLevel: RelationshipLevel
): { maxPerHour: number; maxPerDay: number } {
  const relation = relationBudget(relationshipLevel)
  return {
    maxPerHour: memory.pacing?.maxProactivePerHour ?? relation,
    maxPerDay: memory.pacing?.maxMentionsPerDay ?? Math.max(4, relation * 4),
  }
}

export function shouldAllowPacedProactive(
  memory: SparkyMemory,
  relationshipLevel: RelationshipLevel,
  now = new Date()
): boolean {
  if (inQuietHours(memory, now)) return false
  const dayKey = `global-day:${now.toISOString().slice(0, 10)}`
  const hourKey = `global:${now.toISOString().slice(0, 13)}`
  const usedDay = memory.repetitionState?.hourlyBudgetByBucket?.[dayKey] ?? 0
  const usedHour = memory.repetitionState?.hourlyBudgetByBucket?.[hourKey] ?? 0
  const limits = resolvePacingLimits(memory, relationshipLevel)
  if (usedDay >= limits.maxPerDay) return false
  if (usedHour >= limits.maxPerHour) return false
  return true
}
