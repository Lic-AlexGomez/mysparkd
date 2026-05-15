import type { ActivityCoreExperienceMode } from "@/lib/types/activity-core-stream"

type Weights = { engagement: number; recency: number; proximity: number; activity: number }

const WEIGHTS_BASE: Weights = {
  engagement: 0.28,
  recency: 0.32,
  proximity: 0.22,
  activity: 0.18,
}

type ModeAdj = Partial<Weights> & { boost_events?: number; boost_fd?: number; boost_groups?: number }

const MODE_ADJ: Record<ActivityCoreExperienceMode, ModeAdj> = {
  SOCIAL: { proximity: 0.26, recency: 0.34 },
  DATING: { engagement: 0.34, recency: 0.28, boost_fd: 1.15 },
  BOTH: {},
  MEETUP: { proximity: 0.26, activity: 0.22, boost_events: 1.2 },
  FAST_DATE: { engagement: 0.36, boost_fd: 1.25 },
}

function mergeModeWeights(mode: ActivityCoreExperienceMode): Weights {
  const adj = MODE_ADJ[mode]
  const o: Weights = { ...WEIGHTS_BASE }
  if (adj.engagement != null) o.engagement = adj.engagement
  if (adj.recency != null) o.recency = adj.recency
  if (adj.proximity != null) o.proximity = adj.proximity
  if (adj.activity != null) o.activity = adj.activity
  const sum = o.engagement + o.recency + o.proximity + o.activity
  return {
    engagement: o.engagement / sum,
    recency: o.recency / sum,
    proximity: o.proximity / sum,
    activity: o.activity / sum,
  }
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

export function computeCoreStreamRank(input: {
  timestampIso?: string
  proximityKm?: number
  engagement0to100: number
  pulseActivity0to100: number
  nowMs: number
  mode: ActivityCoreExperienceMode
  bucketBoost?: number
}): {
  rank_score: number
  recency_score: number
  proximity_score: number
  activity_score_component: number
  engagement_probability: number
} {
  const w = mergeModeWeights(input.mode)
  const eng = clamp01(input.engagement0to100 / 100)
  const act = clamp01(input.pulseActivity0to100 / 100)

  const ts = input.timestampIso ? new Date(input.timestampIso).getTime() : input.nowMs
  const ageMs = Math.max(0, input.nowMs - ts)
  const recency = Math.exp(-ageMs / (2.5 * 60 * 60 * 1000))

  let prox = 0.42
  if (input.proximityKm != null && Number.isFinite(input.proximityKm)) {
    prox = 1 / (1 + input.proximityKm / 10)
  }

  const engagement_probability = clamp01(0.55 * eng + 0.45 * act)
  const boost = input.bucketBoost ?? 1

  const rank =
    boost *
    (w.engagement * eng + w.recency * recency + w.proximity * prox + w.activity * act)

  return {
    rank_score: Number(rank.toFixed(4)),
    recency_score: Number(recency.toFixed(4)),
    proximity_score: Number(prox.toFixed(4)),
    activity_score_component: Number(act.toFixed(4)),
    engagement_probability: Number(engagement_probability.toFixed(4)),
  }
}

export function modeBucketBoost(
  mode: ActivityCoreExperienceMode,
  bucket: "events" | "users" | "groups" | "fast_date" | "trends"
): number {
  const adj = MODE_ADJ[mode]
  if (bucket === "events" && adj.boost_events) return adj.boost_events
  if (bucket === "fast_date" && adj.boost_fd) return adj.boost_fd
  if (bucket === "groups" && adj.boost_groups) return adj.boost_groups
  return 1
}
