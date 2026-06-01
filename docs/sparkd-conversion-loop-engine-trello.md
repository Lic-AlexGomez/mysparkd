# Conversion Loop Engine — Trello backlog

**Goal:** Raise **retention** and **real-world conversion** from in-app social actions — Sparkd should guide users *“naturally into real-life interactions.”*

**BFF (this repo):** authenticated routes under **`/api/loop/*`**:

| Brief | Implemented |
|--------|-------------|
| `POST /loop/track` | `POST /api/loop/track` |
| `GET /loop/insights/:userId` | `GET /api/loop/insights/[userId]` (self only) |
| `POST /loop/trigger` | `POST /api/loop/trigger` |

---

## Journey model (`lib/types/conversion-loop.ts`)

Canonical funnel: **swipe → match → chat → event → meetup**.

| Stage | `POST /track` value | Notes |
|--------|---------------------|--------|
| Swipe | `swipe` | Increments `swipe_count`, sets `last_swipe_at` |
| Match | `match` | `last_match_at` |
| Chat | `chat` | `last_chat_at` |
| Event | `event` | `last_event_at` (RSVP / attend — metadata optional) |
| Meetup | `meetup` | `last_meetup_at` |
| Heartbeat | `session` | Updates `last_seen_at` only (used for meetup → return) |

Every track call refreshes **`last_seen_at`** (implicit return signal).

---

## Drop-off detection (`lib/server/conversion-loop-engine.ts`)

| Signal | Meaning | Thresholds (dev defaults) |
|--------|---------|-------------------------|
| **match_no_event** | No event after match | Soft ≥ 3d, hard ≥ 7d without `last_event_at` after `last_match_at` |
| **event_no_chat** | No chat after event | Soft ≥ 24h, hard ≥ 48h |
| **meetup_no_return** | No app return after meetup | Grace ≥ 12h; flag if ≥ 3d and no `last_seen_at` strictly after meetup (+60s epsilon) |

---

## Smart triggers (bridge)

| Product intent | `POST /trigger` `kind` | Surface |
|----------------|-------------------------|---------|
| Events after match | `suggest_events_after_match` or auto when drop-off | `/events` |
| Fast Date after event | `suggest_fast_date_after_event` or auto | `/events` (Fast Date entry), `/chat` |
| Group after chat idle | `suggest_group_after_chat_idle` or auto when chat idle ≥ 5d | `/groups` |

**Recommendation bridge:** `bridge_hints` + **`GET /insights` → `suggested_actions`** mirror **`POST /trigger`** with `kind: "auto"` for one round-trip on feed UI. Production should merge **Recommendation Graph v2** ranks into these surfaces using shared `reason_code`s.

---

## Card CL1 — Funnel Tracking System

- **CL1-B1** — OTLP / warehouse stream: append-only journey facts (`stage`, `metadata`, server timestamps).
- **CL1-B2** — Dedupe idempotent keys (`client_event_id`, match/message IDs).
- **CL1-F1** — Done (dev): `POST /api/loop/track` + in-memory `conversion-loop-store`.

---

## Card CL2 — Behavioral Trigger Engine

- **CL2-B1** — Rules DSL / remote config (thresholds per cohort & locale).
- **CL2-B2** — Frequency caps + quiet hours + push/in-app channel routing.
- **CL2-F1** — Done (dev): `detectDropOffs` + `evaluateTriggers` + `POST /api/loop/trigger`.

---

## Card CL3 — Recommendation Bridge Logic

- **CL3-B1** — Join loop `reason_code` to **Graph v2** ranks (`GET /api/recommendations/user/[id]`).
- **CL3-B2** — Offline evaluation: uplift on “event RSVP within 7d of match”.
- **CL3-F1** — Done (lite): `LoopBridgeHint` / `suggested_actions` deeplinks + **`ConversionLoopCoach`** on feed.

---

## UI

- **Done:** `ConversionLoopCoach` on **Feed** (SOCIAL / BOTH), session ping on feed boot.
- **Next:** Wire `track({ stage })` from swipe decks, chat sends, event RSVP, meetup confirm flows.

---

## JVM parity

- Persist journey ledger + computed segments server-side; keep JSON contracts aligned with this BFF.
- Enforce authz (self-only insights; trigger/track for authenticated viewer only).
