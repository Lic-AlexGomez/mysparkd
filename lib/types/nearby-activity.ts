/**
 * Live Nearby Activity Layer — proxied to GET /api/activity/*
 * Fields align with backend: geo_location, activity_timestamp, engagement_score, visibility_radius
 */

export type NearbyActivityKind =
  | "new_event"
  | "live_user"
  | "forming_group"
  | "trending_plan"
  /** Pair headline from live-feed (`match` verb) */
  | "match_nearby"

/** Normalized row for the UI strip */
export interface NearbyActivityPulse {
  id: string
  kind: NearbyActivityKind
  title: string
  subtitle?: string
  href: string
  /** ISO instant — maps from activity_timestamp */
  activityTimestamp?: string
  engagementScore?: number
  /** km — maps from visibility_radius context or geo hint */
  visibilityRadiusKm?: number
  geoLabel?: string
  /** Client-side sparks when API empty — honest CTAs, not fake users */
  isPlaceholder?: boolean
}

/** Raw API rows may use snake_case */
export type NearbyActivityRaw = Record<string, unknown>
