# Sparkd Activity Core System — Trello backlog

**Goal:** A **single live activity layer** so Sparkd always feels **alive, active, and populated** in SOCIAL, DATING, BOTH, MEETUP, and FAST DATE — *“a live city activity layer where something is always happening.”*

**BFF contract:** `GET /api/activity/core-stream` (product brief `GET /activity/core-stream` on JVM; Next exposes **`/api/activity/core-stream`**).

**Query params:** `lat`, `lng` (pair), optional `city`, `limit`, `mode` (`SOCIAL` | `DATING` | `BOTH` | `MEETUP` | `FAST_DATE`). Auth header optional (improves upstream slices).

---

## Response shape (`lib/types/activity-core-stream.ts`)

| Block | Contents |
|--------|-----------|
| `events` | Soon / now meetups & pulse trending events (never empty — synthetic row if needed) |
| `users` | Active nearby / match pulses |
| `groups` | Discover / group verbs |
| `fast_date` | Live-feed FD hints + `GET /api/date-cards/feed` rows |
| `trends` | Trending / planning / social pulse rows |
| `fallback_items` | Time-of-day, location, category CTAs (always populated) |
| `meta` | `city_label`, `activity_score`, `partial`, `recommendation_boost`, `mode_applied` |

---

## Ranking (`lib/activity-core-ranking.ts`)

Composite **`rank_score`** from **recency**, **proximity**, **pulse activity**, **engagement probability**, with **mode-aware weights** (e.g. `MEETUP` boosts events, `FAST_DATE` boosts FD bucket).

---

## Epic AC1 — Activity Core Engine

- **AC1-B1** — WebSocket / SSE mirror of `core-stream` for sub-second updates.
- **AC1-B2** — Auth-gated “friends activity” overlay without breaking anonymous cold start.
- **AC1-F1** — Done (dev): `aggregateActivityCoreStream` + `GET /api/activity/core-stream`.

---

## Epic AC2 — Stream Aggregation Service

- **AC2-B1** — Replace parallel REST fan-out with JVM **ActivityCoreService** + Redis cache.
- **AC2-B2** — SLA budgets per upstream (degrade gracefully, partial flags).
- **AC2-F1** — Done (dev): composes **live-feed** + **city pulse** + date-cards feed.

---

## Epic AC3 — Fallback Generator System

- **AC3-B1** — ML / rules hybrid: cohort × locale × hour-of-week templates.
- **AC3-B2** — Anti-fatigue caps (same CTA max N per day).
- **AC3-F1** — Done (lite): `buildFallbackCatalog` + per-bucket synthetic minimum rows.

---

## Epic AC4 — Unified Feed API

- **AC4-B1** — Align post feed empty states with `core-stream` ranks (inject “ghost” cards server-side).
- **AC4-B2** — Contract tests vs JVM JSON schema.
- **AC4-F1** — Done (lite): **`ActivityCoreStreamStrip`** on feed / events / groups / tonight empties.

---

## Epic AC5 — Ranking Engine

- **AC5-B1** — Learned weights from conversions (RSVP, chat opens, FD interest).
- **AC5-B2** — Calibration dashboards per metro size.
- **AC5-F1** — Done (dev): `computeCoreStreamRank` + `modeBucketBoost`.

---

## Client

- **`activityCoreStreamService`** — `lib/services/activity-core-stream.ts`
- **`useActivityCoreStream`** — `hooks/use-activity-core-stream.ts`
- **`ActivityCoreStreamStrip`** — `components/activity/activity-core-stream-strip.tsx` (reads `sparkd_location` when coords omitted)

---

## JVM parity

- Ship **`GET /activity/core-stream`** with identical JSON fields.
- Keep **`GET /api/activity/live-feed`** for thin pulse strip; **core-stream** is the superset for full-screen fallbacks.
