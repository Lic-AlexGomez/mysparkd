import type {
  CreateMomentRequest,
  CreateMomentResponse,
  MomentUser,
  MomentsFeedResponse,
  MomentsRecommendationHint,
  MomentsTrendingResponse,
} from "@/lib/types/moments"

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("sparkd_token") : null
  const h: Record<string, string> = { Accept: "application/json" }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function momentsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/moments${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers as Record<string, string>),
    },
  })
  if (!res.ok) {
    const err = await res.text().catch(() => "")
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const momentsService = {
  create(body: CreateMomentRequest): Promise<CreateMomentResponse> {
    return momentsFetch<CreateMomentResponse>("/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  },

  getFeed(userId: string): Promise<MomentsFeedResponse> {
    return momentsFetch<MomentsFeedResponse>(`/feed/${encodeURIComponent(userId)}`)
  },

  getTrending(limit = 20): Promise<MomentsTrendingResponse> {
    return momentsFetch<MomentsTrendingResponse>(`/trending?limit=${limit}`)
  },

  getRecommendationHint(): Promise<MomentsRecommendationHint> {
    return momentsFetch<MomentsRecommendationHint>("/recommendation-hint")
  },
}

/** Fire-and-forget: never blocks UX on moment persistence. */
export function recordMomentSafe(payload: CreateMomentRequest) {
  void momentsService.create(payload).catch(() => {})
}

export function recordJoinMeetup(opts: {
  eventId: string
  eventTitle?: string
  zone?: string
  user?: { userId: string; username?: string; profilePictureUrl?: string | null }
}) {
  const users: MomentUser[] = []
  if (opts.user?.userId) {
    users.push({
      userId: opts.user.userId,
      username: opts.user.username,
      profilePictureUrl: opts.user.profilePictureUrl ?? undefined,
    })
  }
  recordMomentSafe({
    moment_type: "JOIN_MEETUP",
    users_involved: users,
    event_id: opts.eventId,
    location: opts.zone ? { label: opts.zone } : undefined,
    metadata: opts.eventTitle ? { eventTitle: opts.eventTitle } : undefined,
  })
}

export function recordEventAttendance(opts: {
  eventId: string
  attendeeUserId: string
  attendeeUsername?: string
  eventTitle?: string
}) {
  recordMomentSafe({
    moment_type: "EVENT_ATTENDANCE",
    users_involved: [
      { userId: opts.attendeeUserId, username: opts.attendeeUsername },
    ],
    event_id: opts.eventId,
    metadata: opts.eventTitle ? { eventTitle: opts.eventTitle } : undefined,
  })
}

export function recordFastDateMatch(opts: {
  ownerUserId: string
  ownerUsername?: string
  peerUserId: string
  peerUsername?: string
  interestId: string
  dateCardId?: string
}) {
  recordMomentSafe({
    moment_type: "FAST_DATE_MATCH",
    users_involved: [
      { userId: opts.ownerUserId, username: opts.ownerUsername },
      { userId: opts.peerUserId, username: opts.peerUsername },
    ],
    metadata: {
      interestId: opts.interestId,
      dateCardId: opts.dateCardId,
    },
  })
}

export function recordGroupPlanJoined(opts: {
  groupId: string
  groupName?: string
  user?: { userId: string; username?: string; profilePictureUrl?: string | null }
}) {
  const users: MomentUser[] = []
  if (opts.user?.userId) {
    users.push({
      userId: opts.user.userId,
      username: opts.user.username,
      profilePictureUrl: opts.user.profilePictureUrl ?? undefined,
    })
  }
  recordMomentSafe({
    moment_type: "GROUP_PLAN_JOINED",
    users_involved: users,
    group_id: opts.groupId,
    metadata: opts.groupName ? { groupName: opts.groupName } : undefined,
  })
}
