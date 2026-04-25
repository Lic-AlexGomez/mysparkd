import { api } from "@/lib/api"
import type {
  Event,
  EventCapacityUpdate,
  EventCategory,
  EventFilters,
  EventGroupInviteLink,
  EventGroupJoinRequest,
  EventGroupMember,
  EventGroupMessage,
  EventGroupSettings,
  EventParticipant,
  EventPoll,
  EventRole,
  ReactionType,
} from "@/lib/types"

const withQuery = (base: string, params: Record<string, string | number | boolean | undefined | null>) => {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  const qs = sp.toString()
  return `${base}${qs ? `?${qs}` : ""}`
}

export const eventService = {
  // 1) Events
  create: (payload: Record<string, unknown>) =>
    api.post<Event>("/api/events", payload),

  list: (filters?: EventFilters) =>
    api.get<Event[]>(
      withQuery("/api/events", {
        category: filters?.category,
        free: filters?.free,
        minAge: filters?.minAge,
        maxAge: filters?.maxAge,
        lat: filters?.lat,
        lng: filters?.lng,
        radiusKm: filters?.radiusKm,
      })
    ),

  getById: (eventId: string) =>
    api.get<Event>(`/api/events/${eventId}`),

  myCreated: () =>
    api.get<Event[]>("/api/events/me/created"),

  myParticipating: () =>
    api.get<Event[]>("/api/events/me/participating"),

  update: (eventId: string, payload: Record<string, unknown>) =>
    api.put<Event>(`/api/events/${eventId}`, payload),

  remove: (eventId: string) =>
    api.delete<void>(`/api/events/${eventId}`),

  join: (eventId: string) =>
    api.post<void>(`/api/events/${eventId}/join`),

  approveParticipant: (eventId: string, userId: string) =>
    api.post<void>(`/api/events/${eventId}/participants/${userId}/approve`),

  rejectParticipant: (eventId: string, userId: string) =>
    api.post<void>(`/api/events/${eventId}/participants/${userId}/reject`),

  assignModerator: (eventId: string, userId: string) =>
    api.post<void>(`/api/events/${eventId}/participants/${userId}/moderator`),

  removeModerator: (eventId: string, userId: string) =>
    api.delete<void>(`/api/events/${eventId}/participants/${userId}/moderator`),

  participants: {
    list: (eventId: string) =>
      api.get<EventParticipant[]>(`/api/events/${eventId}/participants`),
    pending: (eventId: string) =>
      api.get<EventParticipant[]>(`/api/events/${eventId}/participants/pending`),
  },

  // 2) Event group messages
  groupMessages: {
    list: (eventId: string) =>
      api.get<EventGroupMessage[]>(`/api/events/${eventId}/group/messages`),
    send: (
      eventId: string,
      payload: {
        content?: string
        mediaUrl?: string
        mediaPublicId?: string
        mediaType?: "IMAGE" | "VIDEO" | "AUDIO"
        durationSeconds?: number
      }
    ) =>
      api.post<EventGroupMessage>(`/api/events/${eventId}/group/messages`, payload),
    edit: (eventId: string, messageId: string, content: string) =>
      api.put<EventGroupMessage>(`/api/events/${eventId}/group/messages/${messageId}`, { content }),
    remove: (eventId: string, messageId: string) =>
      api.delete<void>(`/api/events/${eventId}/group/messages/${messageId}`),
  },

  // 3) Reactions in group messages
  reactions: {
    toggleMessageReaction: (messageId: string, reactionType: ReactionType) =>
      api.post<void>("/api/likes/toggle", { targetId: messageId, reactionType }),
    statusByMessage: (messageId: string) =>
      api.get<{ reacted: boolean; reactionType?: ReactionType; total: number }>(`/api/likes/status/${messageId}`),
  },

  // 4) Reports
  reportGroupMessage: (payload: {
    targetId: string
    targetType: "GROUP_MESSAGE"
    reportedUserId: string
    reasonId: string
    description?: string
  }) => api.post<void>("/api/reports", payload),

  // 5) Invite links
  inviteLinks: {
    create: (
      eventId: string,
      payload: {
        targetRole: Extract<EventRole, "MODERATOR" | "GUEST">
        expiresAt?: string
        maxUses?: number
      }
    ) =>
      api.post<EventGroupInviteLink>(`/api/events/${eventId}/group/invite-links`, payload),
    list: (eventId: string) =>
      api.get<EventGroupInviteLink[]>(`/api/events/${eventId}/group/invite-links`),
    remove: (eventId: string, linkId: string) =>
      api.delete<void>(`/api/events/${eventId}/group/invite-links/${linkId}`),
    joinByToken: (token: string) =>
      api.post<void>("/api/group-join-requests/join-by-link", { token }),
  },

  // 6) Group settings
  groupSettings: {
    patch: (eventId: string, payload: EventGroupSettings) =>
      api.patch<void>(`/api/events/${eventId}/group/settings`, payload),
  },

  // 7) Group members
  groupMembers: {
    list: (eventId: string) =>
      api.get<EventGroupMember[]>(`/api/events/${eventId}/group/members`),
    mute: (eventId: string, targetUserId: string, mutedUntil?: string) =>
      api.put<void>(`/api/events/${eventId}/group/members/${targetUserId}/mute`, mutedUntil ? { mutedUntil } : {}),
    unmute: (eventId: string, targetUserId: string) =>
      api.delete<void>(`/api/events/${eventId}/group/members/${targetUserId}/mute`),
    kick: (eventId: string, targetUserId: string) =>
      api.delete<void>(`/api/events/${eventId}/group/members/${targetUserId}`),
  },

  // 8) Polls
  polls: {
    create: (
      eventId: string,
      payload: { question: string; options: string[]; expiresAt?: string }
    ) =>
      api.post<EventGroupMessage>(`/api/events/${eventId}/group/polls`, payload),
    vote: (eventId: string, optionId: string) =>
      api.post<EventPoll>(`/api/events/${eventId}/group/polls/${optionId}/vote`),
  },

  // 9) Group join requests
  groupJoinRequests: {
    create: (eventId: string, inviteeUserIds: string[]) =>
      api.post<EventGroupJoinRequest>(`/api/events/${eventId}/group/join-requests`, { inviteeUserIds }),
    respond: (requestId: string, accept: boolean) =>
      api.post<EventGroupJoinRequest>(`/api/group-join-requests/${requestId}/respond`, { accept }),
    myPending: () =>
      api.get<EventGroupJoinRequest[]>("/api/group-join-requests/me"),
    pendingAdmin: (eventId: string) =>
      api.get<EventGroupJoinRequest[]>(`/api/events/${eventId}/group/join-requests`),
    approve: (eventId: string, requestId: string) =>
      api.post<void>(`/api/events/${eventId}/group/join-requests/${requestId}/approve`),
    reject: (eventId: string, requestId: string) =>
      api.post<void>(`/api/events/${eventId}/group/join-requests/${requestId}/reject`),
  },

  // 10) Share event address
  shareAddress: (eventId: string, address: string) =>
    api.post<void>(`/api/events/${eventId}/group/share-address`, { address }),

  // 11) WS topics for convenience
  topics: {
    eventGroup: (eventId: string) => `/topic/event-group/${eventId}`,
    capacity: (eventId: string) => `/topic/event/${eventId}/capacity`,
  },

  // 12) Reference enums (for UI dropdowns)
  enums: {
    categories: [
      "PARTY",
      "DINNER",
      "CONCERT",
      "SPORTS",
      "NETWORKING",
      "OUTDOOR",
      "GROUP_DATE",
      "CULTURAL",
      "OTHER",
    ] as EventCategory[],
  },
}

export type { EventCapacityUpdate }
