/**
 * Conversion Loop Engine — journey + drop-offs + trigger hints.
 * BFF contract mirrors product brief under `/api/loop/*`.
 */

/** Canonical funnel: swipe → match → chat → event → meetup */
export type ConversionFunnelStage = "swipe" | "match" | "chat" | "event" | "meetup"

/** Implicit heartbeat (updated on track + insights); powers meetup → return detection */
export type ConversionPingStage = ConversionFunnelStage | "session"

export type LoopDropOffKind = "match_no_event" | "event_no_chat" | "meetup_no_return"

export type LoopDropOffSeverity = "soft" | "hard"

export interface LoopTrackMetadata {
  match_id?: string
  peer_user_id?: string
  event_id?: string
  group_id?: string
  channel_id?: string
  /** RSVP, attend, save, etc. — informational */
  event_intent?: string
}

export interface LoopTrackPayload {
  stage: ConversionPingStage
  occurred_at?: string
  metadata?: LoopTrackMetadata
}

export interface LoopTrackResponse {
  ok: true
  journey_updated: boolean
  milestones: ConversionJourneyMilestones
}

export interface ConversionJourneyMilestones {
  swipe_count: number
  last_swipe_at: string | null
  last_match_at: string | null
  last_chat_at: string | null
  last_event_at: string | null
  last_meetup_at: string | null
  last_seen_at: string | null
}

export interface LoopDropOffSignal {
  kind: LoopDropOffKind
  severity: LoopDropOffSeverity
  detected_at: string
  /** Stage timestamp that triggered the check */
  anchor_at: string
  /** Human / product hint */
  message: string
  /** Bridge tag for recommendation surfaces */
  reason_code: string
}

export interface LoopBridgeHint {
  surface: "events_discover" | "fast_date" | "groups_discover" | "chat_list" | "matches"
  reason_code: string
  priority: number
  deeplink: string
}

export interface LoopTriggerAction extends LoopBridgeHint {
  id: string
  title: string
  subtitle?: string
}

export interface LoopInsightsResponse {
  user_id: string
  funnel: {
    swipe: boolean
    match: boolean
    chat: boolean
    event: boolean
    meetup: boolean
  }
  milestones: ConversionJourneyMilestones
  drop_offs: LoopDropOffSignal[]
  bridge_hints: LoopBridgeHint[]
  /** Same planner as `POST /api/loop/trigger` with `kind: "auto"` — one round-trip for feed UI */
  suggested_actions: LoopTriggerAction[]
  generated_at: string
}

export interface LoopTriggerPayload {
  kind?: "auto" | "suggest_events_after_match" | "suggest_fast_date_after_event" | "suggest_group_after_chat_idle"
}

export interface LoopTriggerResponse {
  ok: true
  actions: LoopTriggerAction[]
  evaluated_drop_offs: LoopDropOffKind[]
}
