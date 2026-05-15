/**
 * Context-aware social messaging — BFF under /api/chat/*
 */

export type ContextAwareChatType = "EVENT" | "FAST_DATE" | "GROUP" | "DIRECT"

/** Real-time / product status for header + presence strip */
export type ChatActivityStatus =
  | "ACTIVE"
  | "UPCOMING"
  | "LIVE"
  | "COORDINATING"
  | "IDLE"
  | "ENDED"

export type PeerActivityHint = "IN_APP" | "IN_EVENT" | "IN_FAST_DATE" | "IN_GROUP" | "NEARBY" | "UNKNOWN"

export interface ChatContextResponse {
  chat_id: string
  chat_type: ContextAwareChatType
  context_id: string | null
  context_title: string
  location: string | null
  activity_status: ChatActivityStatus
  participant_count: number
  peer_display_name: string | null
  peer_activity: PeerActivityHint
  /** Static + context-tuned chips (no extra round-trip) */
  quick_replies: string[]
  updated_at: string
}

export interface ChatActivityEntry {
  id: string
  kind: "join" | "presence" | "system" | "momentum"
  text: string
  occurred_at: string
}

export interface ChatActivityResponse {
  chat_id: string
  entries: ChatActivityEntry[]
  active_in_chat_hint: string
  generated_at: string
}

export type ChatClientAction =
  | "view_event"
  | "join_plan"
  | "invite_friends"
  | "convert_meetup"
  | "start_fast_date"
  | "link_context"

export interface ChatActionPayload {
  chat_id: string
  action: ChatClientAction
  /** For link_context */
  chat_type?: ContextAwareChatType
  context_id?: string | null
  context_title?: string
  location?: string | null
  activity_status?: ChatActivityStatus
  participant_count?: number
}

export interface ChatActionResponse {
  ok: boolean
  message?: string
  context?: Partial<ChatContextResponse>
  deeplink?: string
}
