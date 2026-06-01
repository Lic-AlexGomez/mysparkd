# Tonight Mode — Trello backlog (copy/paste into cards)

**Epic:** Tonight Mode — “What can I do tonight with real people?”  
**Front route:** `/tonight` (linked from sidebar, bottom nav, Feed banner).

---

## Backend cards

### Card B1 — `GET /api/tonight/events`
- **Goal:** Events happening **today** in viewer timezone / configured window (e.g. local midnight→next noon).
- **Query:** Optional `lat`, `lng`, `radiusKm` for proximity sort.
- **Response:** JSON array or paginated `content[]`; items MUST expose suggested fields:
  - `event_time` (ISO-8601)
  - `distance_km` (nullable until geo resolved)
  - `activity_score` (0–100 RSVPvelocity/chat/opens aggregate)
  - `real_time_status` (`STARTING_SOON` | `LIVE` | `RSVP_SPIKE` | …)
- **Sort:** Soonest start first; tie-break by `activity_score`, then distance.

### Card B2 — `GET /api/tonight/active-users`
- **Goal:** Users **actively moving now** (open session / heartbeat / recent post RSVP chat signal — privacy-safe).
- **Query:** `lat`, `lng`, optional limit/cursor.
- **Fields:** `last_active_at`, `activity_score`, `activity_hint` (short anonymizable blur optional).
- **Compliance:** Respect consent blocks / invisible mode / GDPR minimization.

### Card B3 — `GET /api/tonight/groups`
- **Goal:** Groups with planning chatter / RSVP spike **today**.
- **Fields:** `planning_snippet`, `member_active_count`, `event_time` optional thread-derived suggestion.

### Card B4 — `GET /api/tonight/plans`
- **Goal:** Spontaneous user-created micro-plans (“coffee @10”).
- **Fields:** `author_username`, `event_time`, `venue_label`, `participant_count`.

### Card B5 — Aggregation / cron / Kafka (optional)
- Precompute `activity_score` per entity nightly & incremental bursts each minute.

---

## Frontend cards

### Card F1 — Ship `/tonight` MVP ✅ (repo)
- `hooks/useTonight.ts`, `lib/services/tonight.ts`, polling refresh ~45s, geo enrich query params.

### Card F2 — Wire empty/error telemetry
- Log `404` vs empty arrays for rollout dashboards.

### Card F3 — Push notifications hook (“Tonight pulse” opt-in)
- Notify users when `activity_score` crosses threshold for followed groups/events.

---

## Data model notes (shared types)

| Field | Where | Notes |
|-------|--------|--------|
| `event_time` | events, plans, groups | Single instant or window `{start,end}` |
| `distance_km` | all geo-aware | Server-side Haversine from JWT profile location |
| `activity_score` | all | Composite; document formula on wiki |
| `real_time_status` | all | Enum strings consumed by `Tonight Mode` UI |

---

## Quick checklist for QA

- [ ] All four endpoints return `200` + empty array when nothing scheduled (no HTML error pages).
- [ ] JWT optional behaviors rejected cleanly (`401`).
- [ ] Lat/lng omitted → still returns city/default ranking without crashing.
