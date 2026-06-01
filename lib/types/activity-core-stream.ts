/**
 * Activity Core System — unified stream for all surfaces.
 * GET /api/activity/core-stream
 */

export type ActivityCoreExperienceMode = "SOCIAL" | "DATING" | "BOTH" | "MEETUP" | "FAST_DATE"

export type ActivityCoreItemSource = "live" | "pulse" | "backend_fd" | "fallback" | "catalog"

export interface ActivityCoreRankBreakdown {
  rank_score: number
  recency_score: number
  proximity_score: number
  activity_score_component: number
  engagement_probability: number
}

export interface ActivityCoreEvent extends ActivityCoreRankBreakdown {
  id: string
  title: string
  subtitle?: string
  href: string
  time_window?: string
  timestamp?: string
  source: ActivityCoreItemSource
}

export interface ActivityCoreUser extends ActivityCoreRankBreakdown {
  id: string
  headline: string
  username?: string
  href: string
  avatar_url?: string
  timestamp?: string
  source: ActivityCoreItemSource
}

export interface ActivityCoreGroup extends ActivityCoreRankBreakdown {
  id: string
  name: string
  subtitle?: string
  href: string
  timestamp?: string
  source: ActivityCoreItemSource
}

export interface ActivityCoreFastDateSlot extends ActivityCoreRankBreakdown {
  id: string
  title: string
  subtitle?: string
  href: string
  timestamp?: string
  source: ActivityCoreItemSource
}

export interface ActivityCoreTrend extends ActivityCoreRankBreakdown {
  id: string
  label: string
  subtitle?: string
  href: string
  timestamp?: string
  source: ActivityCoreItemSource
}

export interface ActivityCoreFallbackItem {
  id: string
  kind: "event" | "user" | "group" | "fast_date" | "trend" | "cta"
  title: string
  subtitle: string
  href: string
  reason: "time_of_day" | "location" | "popular" | "category"
}

export interface ActivityCoreStreamMeta {
  city_label: string
  activity_score: number
  partial: boolean
  generated_at: string
  mode_applied: ActivityCoreExperienceMode
  recommendation_boost: number
}

export interface ActivityCoreStreamResponse {
  events: ActivityCoreEvent[]
  users: ActivityCoreUser[]
  groups: ActivityCoreGroup[]
  fast_date: ActivityCoreFastDateSlot[]
  trends: ActivityCoreTrend[]
  fallback_items: ActivityCoreFallbackItem[]
  meta: ActivityCoreStreamMeta
}
