# Mutual Plans — Trello backlog (backend + frontend)

**Product goal:** *“I’m not going alone — people I know (or like) are going too.”*  
**Primary UX:** `/mutual-plans` + inline block on **`/events/[eventId]`**.

---

## Data model (suggested)

| Field | Type | Notes |
|-------|------|--------|
| `user_id` | UUID | Subject or counterpart |
| `event_id` | UUID | Anchor event / plan |
| `relationship_type` | enum | `match` \| `friend` \| `interest` (extend: `mutual_follow`, `group_member`) |
| `confidence_score` | float 0–100 | Composite: RSVP + graph + recency + optional explicit “interest” |
| `starts_at` | instant | Event start (for sorting) |
| `distance_km` | float? | From viewer location |

**Indexes:** `(event_id, user_id)`, `(user_id, event_id)`, partial index on `confidence_score DESC` for feed.

---

## Backend cards

### B1 — `GET /api/mutual-plans/user/:userId`
- **Auth:** JWT; `:userId` must equal principal or allow admin (define policy).
- **Returns:** JSON object (not array) with keys:
  - `goingWithYou` — connections where **both** are confirmed/approved for same `event_id`
  - `matchesHere` — **match** relationship + shared `event_id` interest/RSVP
  - `friendsInterested` — **friend** / mutual follow + same event or declared interest
  - `sharedPlansNearYou` — aggregated buckets: high `confidence_score`, geo-ranked
- **Each row:** `userId`, `username`, `displayName`, `profilePictureUrl`, `eventId`, `eventTitle`, `relationshipType`, `confidenceScore`, `startsAt`, `distanceKm` (optional)
- **Sort:** `startsAt` asc for time-sensitive; tie-break `confidenceScore` desc

### B2 — `GET /api/mutual-plans/event/:eventId`
- **Auth:** JWT.
- **Returns:** `{ goingWithYou, matchesHere, friendsInterested }` (no `sharedPlansNearYou` — scoped to one event).
- **Privacy:** Only surface users viewer is allowed to see (matches, mutuals, public attendees per product rules).

### B3 — `POST /api/mutual-plans/interest`
- **Body:** `{ "eventId": "uuid", "userId": "optional-target" }`
- **Effect:** Upsert **interest** edge for scoring / notifications (does not replace RSVP if RSVP is separate).
- **Idempotent:** repeated calls OK.

### B4 — `POST /api/mutual-plans/join-event`
- **Body:** `{ "eventId": "uuid" }`
- **Effect:** Bridge to existing join/RSVP pipeline **or** mark “intent to join” for mutual graph before approval.
- **Document** relation to current `POST /api/events/.../join` to avoid double-booking.

### B5 — Scoring job
- Nightly + incremental: compute `confidence_score` from RSVP velocity, chat opens, swipe→match→event funnel, co-attendance history.

### B6 — Compliance
- Blocklist, invisible mode, GDPR export/delete for interest edges.

---

## Frontend cards

### F1 — Ship `/mutual-plans` + event inline ✅ (repo)
- `lib/types/mutual-plans.ts`, `lib/services/mutual-plans.ts`, `hooks/use-mutual-plans.ts`
- Sections: People going with you · Your matches here · Friends interested · Shared plans near you

### F2 — Deep links
- “Say hi” → open DM thread with `userId` when chat API supports deep link (today: `/chat` hub).

### F3 — Express interest CTA
- Button on event card calling `POST /mutual-plans/interest` + toast (wire when B3 live).

### F4 — Analytics
- `mutual_plans_view`, `mutual_row_click`, `mutual_chat_click`, `interest_post`

---

## QA checklist

- [ ] Empty payloads return **200** + empty arrays (not 404 HTML).
- [ ] Event page inline hidden when all three lists empty (no layout jump).
- [ ] `confidence_score` never leaks blocked users.
- [ ] Rate-limit `POST` interest to prevent abuse.
