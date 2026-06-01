# Live Nearby Activity Layer — Trello backlog

**Goal:** Sparkd never feels empty — always-on strip of **real** pulses near the user, plus honest **Spark** CTAs when APIs return nothing.

**Surfaces:** **Feed** + **Events** (`SOCIAL` & `BOTH` only).  
**Frontend:** `components/activity/nearby-activity-layer.tsx`, `hooks/use-nearby-activity.ts`, `lib/services/nearby-activity.ts`.

---

## Data model (contract)

| Field | Maps to UI | Notes |
|-------|------------|--------|
| `geo_location` | `geoLabel` / latlng inputs | City, zone, or `{ lat, lng }` server-side |
| `activity_timestamp` | relative freshness | ISO-8601 |
| `engagement_score` | “Buzz” chip | 0–100 composite |
| `visibility_radius` | optional km badge | Who can see this pulse |

Each pulse row should include enough to render **title**, **subtitle**, **deeplink** (`href` or typed ids).

---

## Backend cards

### B1 — `GET /api/activity/nearby`
- **Purpose:** New events created near viewer + lightweight social hints (no PII leakage).
- **Query:** `lat`, `lng`, optional `radiusKm`, `limit`.
- **Sort:** `engagement_score` DESC, then `activity_timestamp` DESC.

### B2 — `GET /api/activity/trending`
- **Purpose:** Trending **local** plans / hashtags / RSVP velocity windows.
- **Returns:** Same pulse shape; `kind` hints `trending_plan`.

### B3 — `GET /api/activity/live-users`
- **Purpose:** Aggregated “city alive” (counts + anonymized neighborhoods OR opted-in users).
- **Privacy:** Respect invisible mode; minimum aggregation thresholds.

### B4 — `GET /api/activity/new-plans`
- **Purpose:** Micro-plans / spontaneous intents forming **now**.
- **Links:** Event id or future plan id.

### B5 — WebSocket topic `activity:nearby:{geoHash}` (optional)
- Push deltas when scores spike; client falls back to polling (~55s) until subscribed.

### B6 — Anti-empty policy (server-side preferred)
- When sparse regions: return **curated** regional shells (real editorial events), never fabricated users.

---

## Frontend cards

### F1 — Ship activity strip ✅ (repo)
- Feed + Events integration; polling; Spark fallbacks.

### F2 — Subscribe WebSocket when B5 exists
- Re-use global WS client; invalidate merged list on message.

### F3 — Analytics
- `nearby_strip_impression`, `nearby_tile_click`, `nearby_refresh`.

### F4 — Personalization
- Blend Mutual Plans / Tonight scores into ordering.

---

## QA

- [ ] DATING-only mode: strip **hidden** on feed/events.
- [ ] API 404/500: strip still shows **4 Spark tiles** (no blank).
- [ ] Header ping animation only — tiles don’t pulse obnoxiously.
- [ ] Max tiles ~14; horizontal scroll works thumb-first.
