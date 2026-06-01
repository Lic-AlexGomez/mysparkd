# Sparkd Moments — Trello backlog

**Epic:** Capture meaningful social interactions as **shareable moments** (feed surface + recommendations + connection score).  
**UX:** *“Real life is being recorded in real time.”*

**Implemented in this repo (BFF):** Next.js routes under **`/api/moments/*`** (not proxied to JVM). Backend can later mirror **`POST /moments/create`**, **`GET /moments/feed/:userId`**, **`GET /moments/trending`** with the same JSON shape.

---

## Data model (`lib/types/moments.ts`)

| Field | Notes |
|--------|--------|
| `moment_type` | `JOIN_MEETUP` \| `FAST_DATE_MATCH` \| `GROUP_PLAN_JOINED` \| `EVENT_ATTENDANCE` |
| `users_involved` | `{ userId, username?, profilePictureUrl? }[]` |
| `event_id` | Optional |
| `group_id` | Optional |
| `timestamp` | ISO |
| `location` | `{ lat?, lng?, label? }` |
| `headline` | Human-readable line |
| `connection_score_delta` | From `lib/moments-scoring.ts` |

---

## Epic M1 — Moments Engine

- **M1-B1** — Persist moments in primary DB + retention policy; replace in-memory BFF store.
- **M1-B2** — Enforce authz (self + public trending rules); verify JWT server-side.
- **M1-B3** — Emit domain events (`Moment.Created`) for search / ML pipeline.
- **M1-F1** — Done: capture hooks on join / approve / Fast Date accept / group join.

---

## Epic M2 — Feed integration

- **M2-F1** — Done: `SparkdMomentsRail` on home feed (SOCIAL / BOTH).
- **M2-F2** — Optional full-page `/moments` timeline + deep link `?moment=id` renderer.
- **M2-F3** — Inject curated moment cards into main post feed (server-driven).

---

## Epic M3 — Recommendation integration

- **M3-F1** — Done: `GET /api/moments/recommendation-hint` + **compatible** sort bias via `momentAffinityBoost` in `feedService.sortPosts`.
- **M3-B1** — Server-side ranking features from moment histograms (event affinity, geo).
- **M3-B2** — Privacy: aggregate-only signals for users without opt-in.

---

## API summary (BFF)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/moments/create` | Bearer |
| GET | `/api/moments/feed/:userId` | Bearer, **self only** |
| GET | `/api/moments/trending?limit=` | Public |
| GET | `/api/moments/recommendation-hint` | Bearer |

---

## Connection score

Per-type deltas in `CONNECTION_SCORE_DELTA`; user score = **min(100, sum of deltas)** for moments where they appear in `users_involved`. Trending uses decayed score for ordering in the BFF store.
