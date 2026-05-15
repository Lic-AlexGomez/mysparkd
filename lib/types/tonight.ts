/**
 * Tonight Mode — frontend contracts for GET /api/tonight/*
 *
 * Suggested backend fields (document on Trello):
 * - event_time: ISO-8601 instant for “starts at” / window end
 * - distance_km | distanceMeters: proximity to viewer (server resolves from JWT location)
 * - activity_score: 0–100 composite (RSVP velocity, chat velocity, check-ins)
 * - real_time_status: ONLINE_NOW | RSVP_SPIKE | PLANNING | STARTING_SOON | LIVE
 */

export type TonightRealtimeStatus =
  | "ONLINE_NOW"
  | "RSVP_SPIKE"
  | "PLANNING"
  | "STARTING_SOON"
  | "LIVE"
  | string

export interface TonightEventItem {
  id: string
  title: string
  /** ISO datetime */
  eventTime?: string
  /** ISO datetime for event end */
  endTime?: string
  /** Venue or neighborhood label */
  venueLabel?: string
  distanceKm?: number
  activityScore?: number
  realTimeStatus?: TonightRealtimeStatus
  coverImageUrl?: string | null
  attendeePreviewCount?: number
  price?: string
  category?: string
  summary?: string
  organizerName?: string
  likesCount?: number
}

export interface TonightActiveUserItem {
  userId: string
  username: string
  displayName?: string
  profilePictureUrl?: string | null
  /** ISO last activity */
  lastActiveAt?: string
  activityScore?: number
  realTimeStatus?: TonightRealtimeStatus
  /** Short hook e.g. “Going to Café Stereo” */
  activityHint?: string
}

export interface TonightGroupItem {
  groupId: string
  name: string
  /** What they’re planning */
  planningSnippet?: string
  memberActiveCount?: number
  eventTime?: string
  distanceKm?: number
  activityScore?: number
  realTimeStatus?: TonightRealtimeStatus
}

export interface TonightPlanItem {
  planId: string
  title: string
  /** Spontaneous / user-generated plan */
  authorUserId?: string
  authorUsername?: string
  /** ISO when plan happens */
  eventTime?: string
  venueLabel?: string
  distanceKm?: number
  activityScore?: number
  realTimeStatus?: TonightRealtimeStatus
  participantCount?: number
}

/** GET /api/tonight/stream — catalog-first events + tonight social slices. */
export interface TonightStreamResponse {
  events: TonightEventItem[]
  active_users: TonightActiveUserItem[]
  groups: TonightGroupItem[]
  plans: TonightPlanItem[]
  meta: {
    generated_at: string
    partial: boolean
  }
}
