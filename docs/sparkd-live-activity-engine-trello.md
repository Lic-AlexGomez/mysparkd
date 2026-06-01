# Real-Time Activity Engine — Trello epics

**Goal:** One live pulse across Feed, Events, Fast Date, and Groups — *“something is always happening near you.”*  
**Canonical API:** `GET /api/activity/live-feed` (implemented today as **BFF aggregation** in the Next proxy; backend may later replace internals without changing the contract).

---

## Architecture (short)

- **Aggregation:** Proxy intercepts `GET /api/activity/live-feed`, fans out to existing upstream slices (`/api/activity/nearby`, `trending`, `live-users`, `new-plans`, plus optional `groups/discover`), normalizes rows into **`LiveFeedItem`**, clusters planning pulses, ranks, returns JSON.
- **Ranking:** `rankScore = w₁·engagement + w₂·recency + w₃·proximity` (default weights `0.4 / 0.35 / 0.25`).
- **Real-time (future):** WebSocket topic **`activity:live`** pushes `{ itemsPatch | replace, cursor, generatedAt }` compatible with the same DTO.

---

## Epic A — Activity Aggregation Service

**Backend / platform**

- **A-B1** — Append-only **activity ledger** (`verb`, `actor`, `object`, `geo`, `ts`) fed by likes, joins, swipes, event/group lifecycle.
- **A-B2** — Materialized **regional slices** (nearby / tonight bucket) updated from ledger + OLTP.
- **A-B3** — Privacy & consent gates on every projected row (blur, delay, opt-out).

**Frontend**

- **A-F1** — Done: `liveActivityFeedService`, `useLiveActivityFeed`, mapper → nearby strip.

---

## Epic B — Live Feed API

- **B-B1** — Own **`GET /api/activity/live-feed`** on JVM backend (replace BFF fan-out or mirror contract).
- **B-B2** — Stable response schema: `items[]`, `generatedAt`, `meta.weights`, `meta.partial`, `meta.sourceEndpoints`.
- **B-B3** — Pagination: `cursor` / `nextCursor` for infinite strips.

---

## Epic C — Ranking & Scoring Engine

- **C-B1** — Server-side tunable weights per cohort / experiment flag.
- **C-B2** — Explainability: optional `rankReason` per item for QA (internal builds).
- **C-B3** — Anti-spam decay for repetitive actors / bots.

---

## Epic D — WebSocket Layer (future)

- **D-B1** — Topic **`activity:live:{regionHash}`** or **`user:{id}`** personalized stream.
- **D-B2** — Snapshot + delta protocol; reconnect with `cursor`.
- **D-F1** — Subscribe from `useLiveActivityFeed` when socket connected; fallback poll retained.

---

## UX acceptance

- Strip shows mixed verbs: join / match / group / planning cluster / trending.
- Without geo: feed still returns ranked items (proximity neutral).
- Empty upstream: client keeps honest placeholder sparks (existing behavior).

---

## Note on path naming

Product brief cited `GET /activity/live-feed`. Sparkd clients use the **`/api/activity/...`** prefix via **`/api/proxy`**; the implemented route is **`GET /api/activity/live-feed`**.
