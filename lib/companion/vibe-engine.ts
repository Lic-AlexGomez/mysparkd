export type RelationshipLevel = "stranger" | "buddy" | "closeFriend" | "bestie"

export function relationshipLevelFromBondPoints(points: number): RelationshipLevel {
  const p = Number.isFinite(points) ? Math.max(0, Math.min(100, points)) : 0
  if (p >= 80) return "bestie"
  if (p >= 45) return "closeFriend"
  if (p >= 18) return "buddy"
  return "stranger"
}

