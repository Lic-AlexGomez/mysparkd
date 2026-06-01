/**
 * Sparkd Moments — shareable social interaction records.
 * BFF: `POST /api/moments/create`, `GET /api/moments/feed/:userId`, `GET /api/moments/trending`.
 * JVM backend may later mirror `/moments/*` without the `/api` prefix.
 */

export type MomentType =
  | "JOIN_MEETUP"
  | "FAST_DATE_MATCH"
  | "GROUP_PLAN_JOINED"
  | "EVENT_ATTENDANCE"

export interface MomentUser {
  userId: string
  username?: string
  profilePictureUrl?: string
}

export interface MomentLocation {
  lat?: number
  lng?: number
  label?: string
}

export interface SparkdMoment {
  id: string
  moment_type: MomentType
  users_involved: MomentUser[]
  event_id?: string | null
  group_id?: string | null
  /** Fast Date / side metadata */
  metadata?: Record<string, unknown> | null
  timestamp: string
  location?: MomentLocation | null
  /** Human line for feed / share sheet */
  headline: string
  connection_score_delta: number
  /** Relative path for in-app deep link */
  share_path?: string
}

export interface CreateMomentRequest {
  moment_type: MomentType
  users_involved?: MomentUser[]
  event_id?: string | null
  group_id?: string | null
  metadata?: Record<string, unknown> | null
  location?: MomentLocation | null
  /** Optional override; server usually builds from type + actors */
  headline?: string
}

export interface CreateMomentResponse {
  moment: SparkdMoment
  connection_score_total?: number
}

export interface MomentsFeedResponse {
  moments: SparkdMoment[]
  connection_score: number
}

export interface MomentsTrendingResponse {
  moments: SparkdMoment[]
  generated_at: string
}

export interface MomentsRecommendationHint {
  connection_score: number
  /** 0–15, applied to compatible feed ranking */
  affinity_boost: number
  moment_count_30d: number
}
