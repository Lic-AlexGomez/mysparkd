# Pre-event chat rooms — Trello backlog & schema

**Epic:** Pre-event chat — connection *before* the meetup (attendance, retention, real-life conversion).  
**Product surfaces:** Event detail → Chat tab (`/events/[eventId]?tab=chat`), optional `/group/*` parity.

---

## Domain model (schema sketch)

### `EventChatRoom` (logical resource)

| Field | Type | Notes |
|--------|------|--------|
| `eventId` | UUID | 1:1 with event |
| `groupId` | UUID | Optional FK if chat backs onto existing group entity |
| `status` | enum | `OPEN` \| `LIVE` \| `ARCHIVED` \| `CLOSED` |
| `opensAt` | timestamptz | Default: `event.createdAt` (room exists from creation) |
| `closesAt` | timestamptz | Default: `event.endsAt` (or inferred window) |
| `archivedAt` | timestamptz? | When moved to read-only archive |
| `settings` | JSON | Slow mode, admin-only, pin icebreaker message ids |

### Membership / visibility (who sees the room)

Conceptually three audiences **overlap**:

| Audience | Rule |
|-----------|------|
| **Approved attendees** | `participant.status = APPROVED` → full chat + polls vote |
| **Interested (pending)** | Requested / saved interest → read-only or limited post (product decision) |
| **Moderators / host** | Creator + `MODERATOR` role → polls create, settings, approve |

### Messages & polls

Reuse existing `EventGroupMessage` + poll payloads; add optional `kind`:

- `USER` | `SYSTEM` | `ICEBREAKER_SEED` (host-triggered template)

### RSVP / location coordination

- **RSVP:** driven off `participants` + capacity (`currentApprovedCount` / `maxGuests`).
- **Location:** `officialAddress` + optional shared/coordinates; system messages already reflect publish events — hub surfaces the same string for coordination.

---

## REST mapping (requested vs current frontend)

| Spec | Intended behavior | Current app path |
|------|-------------------|------------------|
| `POST /events/:id/chat` | Ensure room exists after event create | `preEventChatService.ensureRoom` → `POST /api/events/:id/chat` (no-op if 404) |
| `GET /events/:id/chat` | Room metadata + lifecycle | `preEventChatService.getRoom` → `GET /api/events/:id/chat` |
| `POST /events/:id/chat/message` | Send chat message | `eventService.groupMessages.send` → `POST /api/events/:id/group/messages` |
| `GET /events/:id/chat/message` (list) | History | `eventService.groupMessages.list` |
| `GET /events/:id/attendees` | Approved list | `eventService.participants.list` → `GET /api/events/:id/participants` |

When backend adds first-class `/chat` routes, keep `/group/*` as legacy alias or migrate with version bump.

---

## Lifecycle

1. **On event create:** `POST /events` succeeds → `POST /events/:id/chat` (idempotent).
2. **Pre-event:** `status=OPEN`, full messaging + polls.
3. **During event:** optional `LIVE` flag for analytics; same permissions unless product gates “interested-only read”.
4. **After `endsAt`:** transition to `ARCHIVED` — read-only, optional export; websocket subscriptions taper.

---

## Backend Trello cards

### B1 — Idempotent `POST /api/events/:id/chat`
Provision room if missing; return `{ roomId, status, opensAt, closesAt }`. Must be safe to call from every event page load.

### B2 — `GET /api/events/:id/chat`
Returns lifecycle + feature flags (`archiveReadOnly`, `interestedCanPost`).

### B3 — Alias or unify `POST …/chat/message` with `…/group/messages`
Single write path; document deprecation timeline.

### B4 — `GET /api/events/:id/attendees`
Stable contract for approved RSVPs (filter + pagination). May alias existing participants list.

### B5 — Interested users in chat
Policy: read-only vs soft-rate-limit posting for `PENDING` participants; enforce in message POST.

### B6 — Archive job
Cron / event-driven: `endsAt + grace` → `ARCHIVED`, freeze votes on active polls, optional snapshot export.

---

## Frontend Trello cards

### F1 — Pre-event hub (shipped baseline)
Icebreakers, RSVP/coordination strip, preset polls for host/mod — sits above message list on Chat tab.

### F2 — Phase-aware UX
Banners for pre / during / post; disable composer when archive read-only (wired when B2/B6 land).

### F3 — Interested lane
Inline list or badge for pending requests with CTA to approve (owner).

### F4 — Analytics hooks
Fire events: `pre_event_chat_prompt_click`, `preset_poll_created`, `rsvp_strip_impression`.

---

## Success metrics

- RSVP velocity in the 48h before `startsAt`
- Messages per unique attendee pre-event
- Show-up rate vs control
- D7 retention among chat participants vs non-participants
