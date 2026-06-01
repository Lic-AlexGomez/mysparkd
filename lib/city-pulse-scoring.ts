/**
 * Map raw pulse metrics → 0–100 score + light personalization boost.
 */

export function computeActivityScore(m: {
  active_users_count: number
  ongoing_events_count: number
  fast_date_activity_count: number
  group_signals_count: number
}): number {
  const u = Math.min(35, (m.active_users_count || 0) * 6)
  const e = Math.min(35, (m.ongoing_events_count || 0) * 8)
  const f = Math.min(20, (m.fast_date_activity_count || 0) * 5)
  const g = Math.min(15, (m.group_signals_count || 0) * 4)
  const raw = u + e + f + g
  return Math.min(100, Math.round(raw))
}

/** 0–10 boost for feed ranking from pulse strength. */
export function pulseRecommendationBoost(activityScore: number): number {
  if (activityScore <= 0) return 0
  return Math.min(10, Math.round(activityScore / 10))
}
