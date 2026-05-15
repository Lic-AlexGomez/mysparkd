# Context-Aware Social Messaging — Trello backlog

**Goal:** Chat is a **live coordination layer for real-world activity**, not a standalone DM app — always linkable to **event**, **meetup**, **Fast Date**, or **group activity**.

**BFF (this repo)** — product brief paths mapped under `/api/chat/*`:

| Brief | Implemented |
|--------|-------------|
| `GET /chat/context/:id` | `GET /api/chat/context/[id]` |
| `GET /chat/activity/:id` | `GET /api/chat/activity/[id]` |
| `POST /chat/action` | `POST /api/chat/action` |

**Context query hints (client → BFF):** `eventId`, `groupId`, `fdId`, `title`, `location`, `count`, `lang` — merged with in-memory `link_context` overrides from `POST /api/chat/action`.

---

## Epic CC1 — Contextual Chat System

- **CC1-B1** — JVM `ChatContextProjection` from RSVP, FD interest accept, group membership.
- **CC1-B2** — Deep links always carry `?eventId=` / `?fdId=` / `?groupId=` from product surfaces.
- **CC1-F1** — Done (dev): types + `GET /api/chat/context/[id]` + header UI + optional `Chat` fields in `lib/types.ts`.

---

## Epic CC2 — Real-time Presence Layer

- **CC2-B1** — Presence v2: `IN_EVENT`, `IN_FD_SESSION`, `IN_GROUP` from device / check-in beacons.
- **CC2-B2** — Typing + activity fan-out via same WS topic as chat.
- **CC2-F1** — Done (lite): online + typing (existing) + `peer_activity` hints from context resolver.

---

## Epic CC3 — Chat Activity Engine

- **CC3-B1** — Append-only activity ledger (joins, RSVPs, geo nudges) from domain events.
- **CC3-B2** — Rate limits + moderation for system lines.
- **CC3-F1** — Done (dev): `GET /api/chat/activity/[id]` + `ChatActivityFeed` strip + synthetic backfill when empty.

---

## Epic CC4 — Chat Action System

- **CC4-B1** — Server-side validation (permissions to invite / convert / start FD).
- **CC4-B2** — Analytics funnel: action → RSVP / FD interest.
- **CC4-F1** — Done (dev): `POST /api/chat/action` + `ChatContextActions` row + `link_context` payload.

---

## Epic CC5 — Smart Reply Engine

- **CC5-B1** — Personalization from graph + mutual plans.
- **CC5-B2** — Safety filters + locale packs.
- **CC5-F1** — Done (lite): `quick_replies[]` on context + `coordination` mode on **`POST /api/ai`** + IA panel tab “Plan”.

---

## Client surfaces

- **`ChatContextHeader`** / **`ChatContextActions`** / **`ChatActivityFeed`** / **`ChatContextQuickReplies`** on `app/(app)/chat/[chatId]/page.tsx`.
- **Fast Date accept** navigates to chat with `?fdId=&title=` for instant context.

---

## JVM parity

- Persist context + activity; keep JSON contracts aligned; enforce auth on `POST /chat/action`.
