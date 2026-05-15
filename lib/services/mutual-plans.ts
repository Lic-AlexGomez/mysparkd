import { api, ApiError } from "@/lib/api"
import type {
  MutualPlansEventBundle,
  MutualPlansUserBundle,
} from "@/lib/types/mutual-plans"

const EMPTY_USER: MutualPlansUserBundle = {
  goingWithYou: [],
  matchesHere: [],
  friendsInterested: [],
  sharedPlansNearYou: [],
}

const EMPTY_EVENT: MutualPlansEventBundle = {
  goingWithYou: [],
  matchesHere: [],
  friendsInterested: [],
}

function asConnArray(v: unknown): MutualPlansUserBundle["goingWithYou"] {
  return Array.isArray(v) ? (v as MutualPlansUserBundle["goingWithYou"]) : []
}

function asSharedArray(v: unknown): MutualPlansUserBundle["sharedPlansNearYou"] {
  return Array.isArray(v) ? (v as MutualPlansUserBundle["sharedPlansNearYou"]) : []
}

function normalizeUserBundle(raw: unknown): MutualPlansUserBundle {
  if (!raw || typeof raw !== "object") return { ...EMPTY_USER }
  const o = raw as Record<string, unknown>
  return {
    goingWithYou: asConnArray(o.goingWithYou ?? o.going_with_you),
    matchesHere: asConnArray(o.matchesHere ?? o.matches_here),
    friendsInterested: asConnArray(o.friendsInterested ?? o.friends_interested),
    sharedPlansNearYou: asSharedArray(o.sharedPlansNearYou ?? o.shared_plans_near_you),
  }
}

function normalizeEventBundle(raw: unknown): MutualPlansEventBundle {
  if (!raw || typeof raw !== "object") return { ...EMPTY_EVENT }
  const o = raw as Record<string, unknown>
  return {
    goingWithYou: asConnArray(o.goingWithYou ?? o.going_with_you),
    matchesHere: asConnArray(o.matchesHere ?? o.matches_here),
    friendsInterested: asConnArray(o.friendsInterested ?? o.friends_interested),
  }
}

/** GET /api/mutual-plans/user/:id — viewer-scoped overlaps */
export async function fetchMutualPlansForUser(userId: string): Promise<MutualPlansUserBundle> {
  if (!userId) return { ...EMPTY_USER }
  try {
    const data = await api.get<unknown>(`/api/mutual-plans/user/${encodeURIComponent(userId)}`)
    return normalizeUserBundle(data)
  } catch {
    return { ...EMPTY_USER }
  }
}

/** GET /api/mutual-plans/event/:id — who you know at this event */
export async function fetchMutualPlansForEvent(eventId: string): Promise<MutualPlansEventBundle> {
  if (!eventId) return { ...EMPTY_EVENT }
  try {
    const data = await api.get<unknown>(`/api/mutual-plans/event/${encodeURIComponent(eventId)}`)
    return normalizeEventBundle(data)
  } catch {
    return { ...EMPTY_EVENT }
  }
}

export type MutualPlansInterestBody = {
  eventId: string
  userId?: string
}

export type MutualPlansJoinEventBody = {
  eventId: string
}

/** POST /api/mutual-plans/interest — register “interested” for overlap scoring */
export async function postMutualPlansInterest(body: MutualPlansInterestBody): Promise<void> {
  await api.post("/api/mutual-plans/interest", body)
}

/** POST /api/mutual-plans/join-event — explicit join for mutual graph (may mirror RSVP) */
export async function postMutualPlansJoinEvent(body: MutualPlansJoinEventBody): Promise<void> {
  await api.post("/api/mutual-plans/join-event", body)
}

export { ApiError }
