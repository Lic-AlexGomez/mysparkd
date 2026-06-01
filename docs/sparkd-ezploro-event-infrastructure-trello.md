# Sparkd × Event infrastructure — Trello epics

Canonical pipeline: **event catalog → Sparkd adapter → activity engine → UI**. Public payloads use **`SparkdEvent`** and related UI types only (no upstream naming in user-visible fields).

## Epics

1. **Event infrastructure core** — Server-side catalog fetch (`GET …/events`), env resolution (`EZPLORO_API_BASE_URL` / `NEXT_PUBLIC_EZPLORO_API_BASE_URL` / `NEXT_PUBLIC_READONLY_EVENTS_API_URL`), normalization in `lib/server/catalog-event-adapter.ts`, resilient unwrap of list/`content`/`items`/`events` payloads.

2. **Sparkd activity graph engine** — `aggregateActivityCoreStream` merges catalog rows (source `catalog`) with pulse, live feed, fast-date backend; catalog **wins on duplicate event ids**; ranking via `computeCoreStreamRank`.

3. **Unified feed system** — `GET /api/feed/live`: `events` (canonical `SparkdEvent[]`) from catalog + `activity` slice from live feed aggregator; `meta.partial` when any upstream is degraded.

4. **TONIGHT real-time engine** — `GET /api/tonight/stream`: catalog-first `TonightEventItem[]` merged with backend `/api/tonight/events`, plus active users, groups, plans from Sparkd backend.

5. **Social layer over events** — Existing tonight/plan/group APIs and live feed verbs remain the experience layer; catalog supplies **event truth** only.

## Routes (Next)

| Route | Role |
|--------|------|
| `GET /api/activity/core-stream` | Full activity graph (events include catalog-first). |
| `GET /api/tonight/stream` | Tonight bundle, catalog-first events. |
| `GET /api/feed/live` | Live feed + canonical events column. |

## Env

- `EZPLORO_API_BASE_URL` or `NEXT_PUBLIC_EZPLORO_API_BASE_URL` — catalog HTTP base including `/api` when the upstream expects it (e.g. `https://api-v3-backend-ezploro.apps.ezploro.com/api`).
- Default catalog base is set in `lib/server/event-infrastructure-url.ts` if unset.
