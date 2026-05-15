import type {
  ConversionJourneyMilestones,
  LoopBridgeHint,
  LoopDropOffKind,
  LoopDropOffSeverity,
  LoopDropOffSignal,
  LoopInsightsResponse,
  LoopTriggerAction,
  LoopTriggerPayload,
} from "@/lib/types/conversion-loop"

const MS_HOUR = 60 * 60 * 1000
const MS_DAY = 24 * MS_HOUR

/** After match, nudge toward events if no event signal */
export const THRESH_MATCH_NO_EVENT_SOFT_MS = 3 * MS_DAY
export const THRESH_MATCH_NO_EVENT_HARD_MS = 7 * MS_DAY

/** After event milestone, expect chat within this window */
export const THRESH_EVENT_NO_CHAT_SOFT_MS = 24 * MS_HOUR
export const THRESH_EVENT_NO_CHAT_HARD_MS = 48 * MS_HOUR

/** After meetup, expect a return session */
export const THRESH_MEETUP_RETURN_GRACE_MS = 12 * MS_HOUR
export const THRESH_MEETUP_NO_RETURN_MS = 3 * MS_DAY
/** Treat `last_seen_at` as "returned" only if strictly after meetup ping */
export const MEETUP_SEEN_EPSILON_MS = 60 * 1000

function parseIso(s: string | null | undefined): number | null {
  if (!s) return null
  const n = Date.parse(s)
  return Number.isFinite(n) ? n : null
}

function nowMs(iso?: string): number {
  if (iso) {
    const p = Date.parse(iso)
    if (Number.isFinite(p)) return p
  }
  return Date.now()
}

export function detectDropOffs(
  m: ConversionJourneyMilestones,
  opts?: { nowIso?: string }
): LoopDropOffSignal[] {
  const now = nowMs(opts?.nowIso)
  const out: LoopDropOffSignal[] = []
  const genAt = new Date(now).toISOString()

  const matchT = parseIso(m.last_match_at)
  const eventT = parseIso(m.last_event_at)
  const chatT = parseIso(m.last_chat_at)
  const meetupT = parseIso(m.last_meetup_at)
  const seenT = parseIso(m.last_seen_at)

  if (matchT != null) {
    const noEventAfter =
      eventT == null || eventT < matchT
    if (noEventAfter && now - matchT >= THRESH_MATCH_NO_EVENT_SOFT_MS) {
      const hard = now - matchT >= THRESH_MATCH_NO_EVENT_HARD_MS
      out.push({
        kind: "match_no_event",
        severity: (hard ? "hard" : "soft") as LoopDropOffSeverity,
        detected_at: genAt,
        anchor_at: m.last_match_at!,
        message: hard
          ? "Match without a shared event in over a week — suggest nearby events."
          : "Recent match — nudge toward events while momentum is high.",
        reason_code: "LOOP_MATCH_NO_EVENT",
      })
    }
  }

  if (eventT != null) {
    const noChatAfter = chatT == null || chatT < eventT
    if (noChatAfter && now - eventT >= THRESH_EVENT_NO_CHAT_SOFT_MS) {
      const hard = now - eventT >= THRESH_EVENT_NO_CHAT_HARD_MS
      out.push({
        kind: "event_no_chat",
        severity: (hard ? "hard" : "soft") as LoopDropOffSeverity,
        detected_at: genAt,
        anchor_at: m.last_event_at!,
        message: hard
          ? "Event milestone but no chat — reopen DM or suggest Fast Date."
          : "After an event, suggest lightweight chat or Fast Date.",
        reason_code: "LOOP_EVENT_NO_CHAT",
      })
    }
  }

  if (meetupT != null && now - meetupT >= THRESH_MEETUP_RETURN_GRACE_MS) {
    const returnedAfter = seenT != null && seenT >= meetupT + MEETUP_SEEN_EPSILON_MS
    if (!returnedAfter && now - meetupT >= THRESH_MEETUP_NO_RETURN_MS) {
      out.push({
        kind: "meetup_no_return",
        severity: "hard",
        detected_at: genAt,
        anchor_at: m.last_meetup_at!,
        message: "Real meetup logged but no app return — win-back / recap prompt.",
        reason_code: "LOOP_MEETUP_NO_RETURN",
      })
    }
  }

  return out
}

function bridgeFromDropOff(d: LoopDropOffSignal): LoopBridgeHint[] {
  switch (d.kind) {
    case "match_no_event":
      return [
        {
          surface: "events_discover",
          reason_code: d.reason_code,
          priority: d.severity === "hard" ? 9 : 6,
          deeplink: "/events",
        },
      ]
    case "event_no_chat":
      return [
        {
          surface: "fast_date",
          reason_code: d.reason_code,
          priority: d.severity === "hard" ? 8 : 5,
          deeplink: "/events",
        },
        {
          surface: "chat_list",
          reason_code: d.reason_code,
          priority: d.severity === "hard" ? 7 : 4,
          deeplink: "/chat",
        },
      ]
    case "meetup_no_return":
      return [
        {
          surface: "events_discover",
          reason_code: d.reason_code,
          priority: 5,
          deeplink: "/feed",
        },
      ]
    default:
      return []
  }
}

function uniqHints(hints: LoopBridgeHint[]): LoopBridgeHint[] {
  const seen = new Set<string>()
  const out: LoopBridgeHint[] = []
  for (const h of hints) {
    const k = `${h.surface}:${h.reason_code}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(h)
  }
  out.sort((a, b) => b.priority - a.priority)
  return out
}

export function buildInsights(userId: string, m: ConversionJourneyMilestones, nowIso?: string): LoopInsightsResponse {
  const dropOffs = detectDropOffs(m, { nowIso })
  const hints = uniqHints(dropOffs.flatMap(bridgeFromDropOff))
  const t = nowIso ?? new Date().toISOString()
  const { actions } = evaluateTriggers(userId, m, { kind: "auto" }, nowIso)

  return {
    user_id: userId,
    funnel: {
      swipe: m.swipe_count > 0 || Boolean(m.last_swipe_at),
      match: Boolean(m.last_match_at),
      chat: Boolean(m.last_chat_at),
      event: Boolean(m.last_event_at),
      meetup: Boolean(m.last_meetup_at),
    },
    milestones: m,
    drop_offs: dropOffs,
    bridge_hints: hints,
    suggested_actions: actions,
    generated_at: t,
  }
}

function actionTitle(surface: LoopBridgeHint["surface"]): string {
  switch (surface) {
    case "events_discover":
      return "Browse events near you"
    case "fast_date":
      return "Try Fast Date"
    case "groups_discover":
      return "Join a group"
    case "chat_list":
      return "Open chats"
    case "matches":
      return "See matches"
    default:
      return "Continue"
  }
}

export function evaluateTriggers(
  _userId: string,
  m: ConversionJourneyMilestones,
  payload: LoopTriggerPayload | undefined,
  nowIso?: string
): { actions: LoopTriggerAction[]; evaluated_drop_offs: LoopDropOffKind[] } {
  const dropOffs = detectDropOffs(m, { nowIso })
  const bridgeHints = uniqHints(dropOffs.flatMap(bridgeFromDropOff))
  const dropKinds = dropOffs.map((d) => d.kind)
  const kindFilter = payload?.kind ?? "auto"
  const now = nowMs(nowIso)

  let mergedHints: LoopBridgeHint[] = []

  if (kindFilter === "suggest_events_after_match") {
    if (dropOffs.some((x) => x.kind === "match_no_event")) {
      mergedHints = bridgeHints.filter((h) => h.surface === "events_discover")
    } else {
      mergedHints = [
        {
          surface: "events_discover",
          reason_code: "LOOP_MANUAL_EVENTS_AFTER_MATCH",
          priority: 4,
          deeplink: "/events",
        },
      ]
    }
  } else if (kindFilter === "suggest_fast_date_after_event") {
    if (dropOffs.some((x) => x.kind === "event_no_chat")) {
      mergedHints = bridgeHints.filter((h) => h.surface === "fast_date" || h.surface === "chat_list")
    } else {
      mergedHints = [
        {
          surface: "fast_date",
          reason_code: "LOOP_MANUAL_FD_AFTER_EVENT",
          priority: 4,
          deeplink: "/events",
        },
      ]
    }
  } else if (kindFilter === "suggest_group_after_chat_idle") {
    const chatT = parseIso(m.last_chat_at)
    const idleMs = 5 * MS_DAY
    if (chatT != null && now - chatT >= idleMs) {
      mergedHints = [
        {
          surface: "groups_discover",
          reason_code: "LOOP_CHAT_IDLE_GROUPS",
          priority: 10,
          deeplink: "/groups",
        },
      ]
    }
  } else {
    mergedHints = [...bridgeHints]
    const chatT = parseIso(m.last_chat_at)
    const idleMs = 5 * MS_DAY
    if (chatT != null && now - chatT >= idleMs && !mergedHints.some((h) => h.surface === "groups_discover")) {
      mergedHints.push({
        surface: "groups_discover",
        reason_code: "LOOP_CHAT_IDLE_GROUPS",
        priority: 3,
        deeplink: "/groups",
      })
    }
  }

  mergedHints = uniqHints(mergedHints)

  const actions: LoopTriggerAction[] = mergedHints.map((h, i) => ({
    ...h,
    id: `${h.surface}-${h.reason_code}-${i}`,
    title: actionTitle(h.surface),
    subtitle: h.reason_code,
  }))

  return {
    actions,
    evaluated_drop_offs: dropKinds,
  }
}
