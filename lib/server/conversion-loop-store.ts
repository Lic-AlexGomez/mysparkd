import type {
  ConversionJourneyMilestones,
  ConversionPingStage,
  LoopTrackMetadata,
} from "@/lib/types/conversion-loop"

type JourneyRow = {
  user_id: string
  swipe_count: number
  last_swipe_at?: string
  last_match_at?: string
  last_chat_at?: string
  last_event_at?: string
  last_meetup_at?: string
  last_seen_at?: string
  updated_at: string
}

type GlobalLoop = { map: Map<string, JourneyRow> }
const g = globalThis as unknown as { __sparkd_conversion_loop__?: GlobalLoop }

function bucket(): Map<string, JourneyRow> {
  if (!g.__sparkd_conversion_loop__) g.__sparkd_conversion_loop__ = { map: new Map() }
  return g.__sparkd_conversion_loop__.map
}

function ensure(userId: string): JourneyRow {
  const uid = String(userId || "").trim()
  const m = bucket()
  let r = m.get(uid)
  if (!r) {
    r = { user_id: uid, swipe_count: 0, updated_at: new Date().toISOString() }
    m.set(uid, r)
  }
  return r
}

export function touchSeen(userId: string, at?: string): void {
  const t = at ?? new Date().toISOString()
  const r = ensure(userId)
  r.last_seen_at = t
  r.updated_at = t
}

export function applyLoopTrack(
  userId: string,
  stage: ConversionPingStage,
  occurredAt?: string,
  metadata?: LoopTrackMetadata
): JourneyRow {
  const t = occurredAt?.trim() || new Date().toISOString()
  const r = ensure(userId)
  r.last_seen_at = t
  r.updated_at = t

  switch (stage) {
    case "swipe":
      r.swipe_count = (r.swipe_count || 0) + 1
      r.last_swipe_at = t
      break
    case "match":
      r.last_match_at = t
      break
    case "chat":
      r.last_chat_at = t
      break
    case "event":
      r.last_event_at = t
      break
    case "meetup":
      r.last_meetup_at = t
      break
    case "session":
      break
    default:
      break
  }

  void metadata
  return r
}

export function getJourney(userId: string): JourneyRow | null {
  const uid = String(userId || "").trim()
  if (!uid) return null
  return bucket().get(uid) ?? null
}

export function milestonesFromRow(r: JourneyRow | null): ConversionJourneyMilestones {
  if (!r) {
    return {
      swipe_count: 0,
      last_swipe_at: null,
      last_match_at: null,
      last_chat_at: null,
      last_event_at: null,
      last_meetup_at: null,
      last_seen_at: null,
    }
  }
  return {
    swipe_count: r.swipe_count,
    last_swipe_at: r.last_swipe_at ?? null,
    last_match_at: r.last_match_at ?? null,
    last_chat_at: r.last_chat_at ?? null,
    last_event_at: r.last_event_at ?? null,
    last_meetup_at: r.last_meetup_at ?? null,
    last_seen_at: r.last_seen_at ?? null,
  }
}
