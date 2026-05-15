# Recommendation Graph v2 — Trello backlog

**Goal:** One intelligent graph over **users, events, groups, Fast Date, moments signals** so Sparkd feels like *“it understands who you should meet next.”*

**BFF (this repo):** authenticated routes mirror the brief under the **`/api/*`** prefix:

| Brief | Implemented |
|--------|-------------|
| `GET /recommendations/user/:id` | `GET /api/recommendations/user/[userId]` (self only) |
| `POST /graph/update` | `POST /api/graph/update` |
| `GET /graph/similarity/:id` | `GET /api/graph/similarity/[userId]` (self only) |

---

## Graph model (`lib/types/recommendation-graph-v2.ts`)

| Relationship | Edge kinds |
|----------------|------------|
| user ↔ user | `USER_USER` (via graph update + follow/match inference) |
| user ↔ event | `USER_EVENT` |
| user ↔ group | `USER_GROUP` |
| user ↔ moment | `USER_MOMENT` (hints string bucketed into overlap) |

---

## Scoring (`lib/recommendation-graph-scoring.ts`)

| Signal | Role |
|--------|------|
| **affinity_score** | Weighted blend for ranking (primary). |
| **social_distance** | Lower when socially closer (inverse proximity). |
| **activity_overlap** | Buckets from mutual follow / stored edges / prefs. |
| **location_match** | Zones string overlap + optional lat/lng Haversine. |

---

## Epic RG1 — Graph engine core

- **RG1-B1** — OLTP-backed adjacency store (Postgres / Neo4j / TigerGraph — pick one).
- **RG1-B2** — Stream ingest from RSVP, chat velocity, FD accepts, group joins, Moments ledger.
- **RG1-F1** — Done (dev): in-memory **viewer_signals** + edge append via `POST /api/graph/update`.

---

## Epic RG2 — Scoring system

- **RG2-B1** — Learned weights (bandits / offline replay) vs fixed blend.
- **RG2-B2** — Explainability: `reason_codes[]` per recommendation.
- **RG2-F1** — Done: `composeAffinityScores` + bucketed overlap.

---

## Epic RG3 — Recommendation API

- **RG3-B1** — Pagination + `cursor` + ETag per viewer slice.
- **RG3-B2** — Cold-start protocol (geo + interests only).
- **RG3-F1** — Done: `aggregateRecommendations` fan-out from existing REST slices.

---

## Epic RG4 — Data sync layer

- **RG4-B1** — Outbox from domain events → graph workers (idempotent).
- **RG4-B2** — GDPR export/delete: cascade edge removal.
- **RG4-F1** — Done (lite): feed boot sync posts lat/lng once per session (`sparkd_graph_v2_loc`).

---

## Client surfaces

- **`RecommendationGraphPeek`** on home feed (SOCIAL graph surfaces).
- **`recommendationGraphV2Service`** + **`useRecommendationGraphV2`** for deeper screens.

---

## JVM parity checklist

- Mirror JSON contracts exactly.
- Enforce authz server-side (no JWT decode-only in prod).
- Replace BFF aggregation with single **`RecommendationGraphService`** query plan.
