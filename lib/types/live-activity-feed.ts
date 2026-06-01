/**
 * Unified live activity stream — GET /api/activity/live-feed (BFF aggregation).
 * WebSocket layer can mirror the same item shape under topic `activity:live`.
 */

export type LiveFeedVerb =
  | "event_created"
  | "event_join"
  | "match"
  | "group_created"
  | "planning_cluster"
  | "user_active"
  | "trending_plan"
  | "social_pulse"

export interface LiveFeedActor {
  userId?: string
  username?: string
  avatarUrl?: string
}

export interface LiveFeedTarget {
  type: "event" | "group" | "user" | "plan"
  id: string
  title?: string
}

export interface LiveFeedItem {
  id: string
  verb: LiveFeedVerb
  headline: string
  subtitle?: string
  href?: string
  timestamp: string
  actors?: LiveFeedActor[]
  target?: LiveFeedTarget
  /** Viewer-relative distance when coords known */
  proximityKm?: number
  engagementScore: number
  /** Combined proximity + recency + engagement (0–1) */
  rankScore: number
  /** Which upstream slice produced this row (debug / analytics) */
  source?: string
}

export interface LiveFeedMeta {
  weights: { engagement: number; recency: number; proximity: number }
  partial?: boolean
  /** Endpoints that responded OK */
  sourceEndpoints?: string[]
}

export interface LiveFeedResponse {
  items: LiveFeedItem[]
  generatedAt: string
  meta: LiveFeedMeta
}
