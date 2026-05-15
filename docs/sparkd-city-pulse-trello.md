# City Pulse System — Trello backlog

**Goal:** Real-time **social density per city** — Sparkd should feel like *“your city is alive right now.”*

**Implemented BFF:** `GET /api/city/pulse?city=` **or** `lat` + `lng` (required pair when `city` omitted).  
Upstream product brief used `GET /city/pulse`; Sparkd exposes the same contract under **`/api/city/pulse`** on the Next app.

---

## Response shape (`lib/types/city-pulse.ts`)

| Field | Purpose |
|--------|---------|
| `city_label` | Display name (query `city`, top hot zone, or “Your area”). |
| `activity_score` | **0–100** composite from users, events, Fast Date signals, groups. |
| `metrics` | `active_users_count`, `ongoing_events_count`, `fast_date_activity_count`, `group_signals_count`, `group_formation_rate`. |
| `trending_events` | Thin event highlights with optional `event_id`, `zone_label`, `engagement_hint`. |
| `hot_zones` | Optional geo clusters (zone-label buckets + `intensity`). |
| `recommendation_boost` | **0–10** — biases global feed **Relevant** / **Compatible** sorts (see `hooks/use-feed.ts`). |
| `partial` | Some upstream activity slices failed. |

---

## Epic CP1 — City Pulse Aggregation

- **CP1-B1** — Replace BFF fan-out with JVM **`CityPulseService`** reading telemetry + OLTP (events, FD, groups, presence).
- **CP1-B2** — Normalize city identifiers (`city_id`, timezone, locale aliases).
- **CP1-F1** — Done: `aggregateCityPulse` composes `/api/activity/*` + `/api/groups/discover`.

---

## Epic CP2 — Geo clustering logic

- **CP2-B1** — True clusters (H3 / geohash / DBSCAN) on lat-lng events & sessions.
- **CP2-B2** — Privacy budgets — aggregate counts only, k-anonymity thresholds.
- **CP2-F1** — Done (lite): `hot_zones` from **zone-label histogram** on filtered rows.

---

## Epic CP3 — Pulse scoring engine

- **CP3-B1** — Tunable weights / calibration per metro size (avoid small cities stuck at 0).
- **CP3-B2** — Seasonality & time-of-day normalization.
- **CP3-F1** — Done: `computeActivityScore` + `pulseRecommendationBoost` in `lib/city-pulse-scoring.ts`.

---

## Epic CP4 — API endpoint

- **CP4-B1** — JVM route **`GET /city/pulse`** (or `/api/city/pulse`) matching JSON contract + caching (CDN / edge).
- **CP4-F2** — Auth strategy: public pulse vs personalized overlays (friends density).
- **CP4-F1** — Done: **`app/api/city/pulse/route.ts`** + `cityPulseService` client.

---

## UI (done / planned)

- **Done:** `CityPulseIndicator` on **Feed** and **Events** when `sparkd_location` or meetup coords exist (SOCIAL / BOTH).
- **Done:** Feed ranking uses `recommendation_boost` alongside Moments hint.
- **Next:** Discovery cards — badge rows whose `zone` matches a **hot_zone** label when pulse loaded.

---

## UX acceptance

- Pulse loads without blocking navigation; stale-safe polling (hook default ~2 min).
- “Alive” copy when `activity_score ≥ 42` (tunable).
