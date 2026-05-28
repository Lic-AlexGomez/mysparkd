import type { SparkyMemory } from "@/lib/sparky-memory"
import { sanitizeSparkyMemory } from "@/lib/sparky-memory"

/** Fusiona copia local y remota; gana la más reciente por `updatedAt`, bond = máximo. */
export function mergeSparkyMemory(local: SparkyMemory, remote: SparkyMemory): SparkyMemory {
  const localAt = local.updatedAt ? Date.parse(local.updatedAt) : 0
  const remoteAt = remote.updatedAt ? Date.parse(remote.updatedAt) : 0
  const newerFirst = remoteAt >= localAt ? remote : local
  const older = remoteAt >= localAt ? local : remote
  return sanitizeSparkyMemory({
    ...older,
    ...newerFirst,
    bondPoints: Math.max(local.bondPoints ?? 0, remote.bondPoints ?? 0, older.bondPoints ?? 0),
    wardrobeUnlocked: [
      ...new Set([...(older.wardrobeUnlocked ?? []), ...(newerFirst.wardrobeUnlocked ?? [])]),
    ],
    insideJokesUnlocked: [
      ...new Set([...(older.insideJokesUnlocked ?? []), ...(newerFirst.insideJokesUnlocked ?? [])]),
    ].slice(-24),
    emotionalMoments: [...(older.emotionalMoments ?? []), ...(newerFirst.emotionalMoments ?? [])].slice(-40),
    repetitionState: {
      ...(older.repetitionState ?? {}),
      ...(newerFirst.repetitionState ?? {}),
      cooldownByKey: {
        ...(older.repetitionState?.cooldownByKey ?? {}),
        ...(newerFirst.repetitionState?.cooldownByKey ?? {}),
      },
      hourlyBudgetByBucket: {
        ...(older.repetitionState?.hourlyBudgetByBucket ?? {}),
        ...(newerFirst.repetitionState?.hourlyBudgetByBucket ?? {}),
      },
      recentLineKeys: [
        ...new Set([
          ...(older.repetitionState?.recentLineKeys ?? []),
          ...(newerFirst.repetitionState?.recentLineKeys ?? []),
        ]),
      ].slice(-30),
    },
    activeNickname: newerFirst.activeNickname ?? older.activeNickname,
    archetype: newerFirst.archetype ?? older.archetype,
    pacing: newerFirst.pacing ?? older.pacing,
  })
}
