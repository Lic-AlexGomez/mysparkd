import { api, ApiError } from "@/lib/api"
import type { EventParticipant, EventStatus } from "@/lib/types"
import { eventService } from "@/lib/services/event"

export type EventChatPhase = "pre" | "during" | "after"

export function deriveEventChatPhase(params: {
  startsAt?: string | null
  endsAt?: string | null
  status?: EventStatus | string | null
}): EventChatPhase {
  const now = Date.now()
  const startMs = params.startsAt ? new Date(params.startsAt).getTime() : NaN
  const endMs = params.endsAt ? new Date(params.endsAt).getTime() : NaN
  const st = String(params.status || "").toUpperCase()

  if (st === "FINISHED" || st === "EXPIRED" || st === "CANCELLED") return "after"
  if (Number.isFinite(endMs) && now > endMs) return "after"
  if (!Number.isFinite(startMs)) return "pre"
  if (now < startMs) return "pre"
  return "during"
}

/**
 * Pre-event / event chat façade.
 * Today the live chat uses `/api/events/:id/group/messages` (see `eventService`).
 * These helpers align with the planned REST surface (`/chat`, `/attendees`) for forward compatibility.
 */
export const preEventChatService = {
  /** POST `/api/events/:id/chat` — provision or revive room when backend adds it. Safe no-op on 404/405. */
  async ensureRoom(eventId: string): Promise<void> {
    try {
      await api.post(`/api/events/${eventId}/chat`, {})
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return
      console.warn("[pre-event-chat] ensureRoom", e)
    }
  },

  /** GET `/api/events/:id/chat` — metadata (lifecycle, archive flag) when available. */
  async getRoom(eventId: string): Promise<Record<string, unknown> | null> {
    try {
      return await api.get<Record<string, unknown>>(`/api/events/${eventId}/chat`)
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return null
      throw e
    }
  },

  /** GET `/api/events/:id/attendees` — approved RSVPs; alias of `participants.list` today. */
  listAttendees(eventId: string): Promise<EventParticipant[]> {
    return eventService.participants.list(eventId)
  },

  /** POST `/api/events/:id/chat/message` maps to group message send today. */
  sendChatMessage: eventService.groupMessages.send.bind(eventService.groupMessages),

  listMessages: eventService.groupMessages.list.bind(eventService.groupMessages),
}
