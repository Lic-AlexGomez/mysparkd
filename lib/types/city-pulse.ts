/**
 * City Pulse — social density / activity snapshot per city or geo viewport.
 * BFF: GET `/api/city/pulse?city=` | `lat` + `lng` (Sparkd prefix `/api/city/pulse`).
 */

export interface CityPulseTrendingEvent {
  event_id?: string
  title: string
  zone_label?: string
  engagement_hint?: number
}

export interface CityPulseHotZone {
  /** Cluster label (neighborhood, zone text from upstream rows). */
  label: string
  /** Relative intensity 0–100 within this pulse response. */
  intensity: number
  signal_count: number
}

export interface CityPulseMetrics {
  /** Estimated active people signals (live-users slice after filters). */
  active_users_count: number
  /** Rows attributed to meetups / events density. */
  ongoing_events_count: number
  /** Fast Date / date-card style signals in window. */
  fast_date_activity_count: number
  /** Recent-ish groups touching this city (formation proxy). */
  group_signals_count: number
  /** Simple derivative: group_signals per day heuristic (0–5 scale capped). */
  group_formation_rate: number
}

export interface CityPulseResponse {
  city_label: string
  activity_score: number
  metrics: CityPulseMetrics
  trending_events: CityPulseTrendingEvent[]
  hot_zones: CityPulseHotZone[]
  /** Non-empty when upstream slices failed partially. */
  partial?: boolean
  generated_at: string
  /** For recommendation layer — bump compatible/relevant sorts slightly when city is “alive”. */
  recommendation_boost: number
}
