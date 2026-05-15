/**
 * Recommendation Graph v2 — unified graph view over users, events, groups, Fast Date, moments signals.
 * BFF routes: `/api/recommendations/user/[userId]`, `/api/graph/update`, `/api/graph/similarity/[userId]`.
 */

export type GraphEdgeKind =
  | "USER_USER"
  | "USER_EVENT"
  | "USER_GROUP"
  | "USER_DATE_CARD"
  | "USER_MOMENT"

export interface GraphEdge {
  kind: GraphEdgeKind
  source_id: string
  target_id: string
  /** Optional edge weight 0–1 */
  weight?: number
  metadata?: Record<string, unknown>
}

export interface RecommendationScores {
  /** Combined ranking score 0–100 */
  affinity_score: number
  /** Lower = socially closer in this graph snapshot (inverse proximity). */
  social_distance: number
  /** Shared buckets / edges overlap with viewer signals (0–100). */
  activity_overlap: number
  /** Geo / zone alignment vs viewer signals (0–100). */
  location_match: number
}

export interface RecommendedPerson {
  kind: "person"
  user_id: string
  username?: string
  profile_picture_url?: string
  headline?: string
  scores: RecommendationScores
  reasons?: string[]
}

export interface RecommendedEvent {
  kind: "event"
  event_id: string
  title: string
  zone?: string
  starts_at?: string
  scores: RecommendationScores
}

export interface RecommendedGroup {
  kind: "group"
  group_id: string
  name: string
  category?: string
  member_count?: number
  scores: RecommendationScores
}

export interface RecommendedFastDate {
  kind: "fast_date"
  date_card_id: string
  title: string
  location_zone?: string
  category?: string
  scores: RecommendationScores
}

export type RecommendationItem =
  | RecommendedPerson
  | RecommendedEvent
  | RecommendedGroup
  | RecommendedFastDate

export interface RecommendationsResponse {
  viewer_id: string
  generated_at: string
  graph_version: "v2-bff"
  partial?: boolean
  people: RecommendedPerson[]
  events: RecommendedEvent[]
  groups: RecommendedGroup[]
  fast_dates: RecommendedFastDate[]
}

export interface GraphUpdatePayload {
  edges?: GraphEdge[]
  /** Lightweight viewer-centric signals for overlap scoring (no raw PII beyond IDs/zones). */
  viewer_signals?: {
    preferred_zones?: string[]
    attended_event_ids?: string[]
    joined_group_ids?: string[]
    moment_edge_hints?: string[]
    latitude?: number
    longitude?: number
  }
}

export interface GraphUpdateResponse {
  ok: boolean
  edges_indexed: number
  signals_merged: boolean
}

export interface SimilarPeer {
  user_id: string
  username?: string
  similarity_score: number
  shared_signals: string[]
}

export interface SimilarityResponse {
  viewer_id: string
  generated_at: string
  peers: SimilarPeer[]
}
