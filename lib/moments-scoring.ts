import type { MomentType, SparkdMoment } from "@/lib/types/moments"

/** Per-moment bump toward “connection score” (capped when aggregating). */
export const CONNECTION_SCORE_DELTA: Record<MomentType, number> = {
  JOIN_MEETUP: 6,
  FAST_DATE_MATCH: 14,
  GROUP_PLAN_JOINED: 8,
  EVENT_ATTENDANCE: 12,
}

export function deltaForMomentType(t: MomentType): number {
  return CONNECTION_SCORE_DELTA[t] ?? 5
}

/** Sum deltas for moments where `userId` appears in `users_involved` (cap 100). */
export function connectionScoreForUser(userId: string, moments: SparkdMoment[]): number {
  const uid = String(userId || "").trim()
  if (!uid) return 0
  let sum = 0
  for (const m of moments) {
    const involved = (m.users_involved || []).some((u) => String(u.userId) === uid)
    if (!involved) continue
    sum += m.connection_score_delta || deltaForMomentType(m.moment_type)
  }
  return Math.min(100, sum)
}

/** Small boost for “compatible” feed sort — more real-world activity → slightly higher affinity. */
export function affinityBoostFromMoments(moments: SparkdMoment[], windowMs = 30 * 24 * 60 * 60 * 1000): number {
  const cutoff = Date.now() - windowMs
  const n = moments.filter((m) => new Date(m.timestamp).getTime() >= cutoff).length
  return Math.min(15, Math.floor(n * 2.2))
}
