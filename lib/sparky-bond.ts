import type { SparkyMemory } from "@/lib/sparky-memory"

export type SparkBondLevel = {
  level: number
  label: string
  minPoints: number
}

export const SPARK_BOND_LEVELS: SparkBondLevel[] = [
  { level: 1, label: "Chispa nueva", minPoints: 0 },
  { level: 2, label: "Buena vibra", minPoints: 12 },
  { level: 3, label: "Spark Buddy", minPoints: 28 },
  { level: 4, label: "Glow Mode", minPoints: 50 },
]

export function getSparkBond(memory: SparkyMemory): {
  level: number
  label: string
  points: number
  nextLabel?: string
  progress: number
} {
  const points = memory.bondPoints ?? 0
  let current = SPARK_BOND_LEVELS[0]
  for (const row of SPARK_BOND_LEVELS) {
    if (points >= row.minPoints) current = row
  }
  const next = SPARK_BOND_LEVELS.find((r) => r.minPoints > points)
  const progress = next
    ? (points - current.minPoints) / Math.max(1, next.minPoints - current.minPoints)
    : 1
  return {
    level: current.level,
    label: current.label,
    points,
    nextLabel: next?.label,
    progress: Math.min(1, Math.max(0, progress)),
  }
}

export function addBondPoints(memory: SparkyMemory, delta: number): SparkyMemory {
  return {
    ...memory,
    bondPoints: Math.min(99, Math.max(0, (memory.bondPoints ?? 0) + delta)),
  }
}
