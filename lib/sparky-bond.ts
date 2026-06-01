import type { SparkyMemory } from "@/lib/sparky-memory"

export const SPARK_BOND_LEVELS = [
  { level: 1, label: "Chispa nueva", minPoints: 0 },
  { level: 2, label: "Buena vibra", minPoints: 8, unlock: "peek_anim" },
  { level: 3, label: "Spark Buddy", minPoints: 18, unlock: "dialogue_warm" },
  { level: 4, label: "Glow Mode", minPoints: 30, unlock: "celebrate_lottie" },
  { level: 5, label: "Constelación", minPoints: 45, unlock: "companion_slime" },
  { level: 10, label: "Supernova", minPoints: 100, unlock: "wardrobe_crown" },
]

export function getSparkBond(memory: SparkyMemory) {
  const points = Math.min(100, memory.bondPoints ?? 0)
  let current = SPARK_BOND_LEVELS[0]
  for (const row of SPARK_BOND_LEVELS) {
    if (points >= row.minPoints) current = row
  }
  const next = SPARK_BOND_LEVELS.find((r) => r.minPoints > points)
  const unlocks = SPARK_BOND_LEVELS.filter((r) => points >= r.minPoints && r.unlock).map((r) => r.unlock!)
  return {
    level: current.level,
    label: current.label,
    points,
    progress: next ? (points - current.minPoints) / Math.max(1, next.minPoints - current.minPoints) : 1,
    unlocks,
  }
}

export function addBondPoints(memory: SparkyMemory, delta: number): SparkyMemory {
  const next = { ...memory, bondPoints: Math.min(100, Math.max(0, (memory.bondPoints ?? 0) + delta)) }
  const unlocks = getSparkBond(next).unlocks.filter((u) => u.startsWith("wardrobe_"))
  return { ...next, wardrobeUnlocked: [...new Set([...(memory.wardrobeUnlocked ?? []), ...unlocks])] }
}

export function isCompanionUnlockedByBond(bondRequired: number | undefined, points: number): boolean {
  return points >= (bondRequired ?? 0)
}
