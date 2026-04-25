import { api } from "@/lib/api"
import type {
  CreateGroupRequest,
  Group,
  GroupFeedVisibility,
  GroupInviteLink,
  GroupMember,
  GroupMessage,
  GroupRole,
  GroupTalkPermission,
} from "@/lib/types"

export const groupService = {
  searchUsersByInput: async (input: string): Promise<Array<{ userId: string; username: string; fullName?: string; photo?: string }>> => {
    const raw = (input || "").trim()
    if (!raw) return []
    const candidate = raw.startsWith("@") ? raw.slice(1) : raw

    const extractRows = (response: any): any[] =>
      Array.isArray(response)
        ? response
        : Array.isArray(response?.content)
          ? response.content
          : Array.isArray(response?.users)
            ? response.users
            : []

    const normalize = (rows: any[]) =>
      rows
        .map((u) => {
          const userId = String(u?.userId || u?.id || u?.profileId || "")
          const username = String(u?.username || "").trim()
          const fullName = [u?.nombres, u?.apellidos].filter(Boolean).join(" ").trim() || undefined
          const photo = u?.profilePictureUrl || u?.photo || u?.avatar || u?.urlProfilePicture
          if (!userId || !username) return null
          return { userId, username, fullName, photo }
        })
        .filter(Boolean) as Array<{ userId: string; username: string; fullName?: string; photo?: string }>

    const endpoints = [
      `/api/search/autocomplete?q=${encodeURIComponent("@" + candidate)}`,
      `/api/search/autocomplete?q=${encodeURIComponent(candidate)}`,
      `/api/search/users?query=${encodeURIComponent(candidate)}`,
      `/api/search/general?query=${encodeURIComponent(candidate)}`,
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await api.get<any>(endpoint)
        const rows = normalize(extractRows(response))
        if (rows.length > 0) return rows
      } catch {
        // try next endpoint
      }
    }

    return []
  },

  resolveUserIdInput: async (input: string): Promise<string> => {
    const raw = (input || "").trim()
    const candidate = raw.startsWith("@") ? raw.slice(1) : raw
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (uuidRegex.test(candidate)) return candidate

    const rows = await groupService.searchUsersByInput(candidate)
    const exact =
      rows.find((u) => u.username.toLowerCase() === candidate.toLowerCase()) ||
      rows[0]
    if (!exact?.userId) throw new Error("No se encontró un usuario con ese username")
    return exact.userId
  },

  create: (payload: CreateGroupRequest) =>
    api.post<Group>("/api/groups", payload),

  myGroups: () =>
    api.get<Group[]>("/api/groups"),

  discover: (params?: { feed?: GroupFeedVisibility; category?: string }) => {
    const sp = new URLSearchParams()
    if (params?.feed) sp.set("feed", params.feed)
    if (params?.category) sp.set("category", params.category)
    const qs = sp.toString()
    return api.get<Group[]>(`/api/groups/discover${qs ? `?${qs}` : ""}`)
  },

  getById: (groupId: string) =>
    api.get<Group>(`/api/groups/${groupId}`),

  update: (groupId: string, payload: Partial<CreateGroupRequest>) =>
    api.put<Group>(`/api/groups/${groupId}`, payload),

  remove: (groupId: string) =>
    api.delete<void>(`/api/groups/${groupId}`),

  joinPublic: (groupId: string) =>
    api.post<Group>(`/api/groups/${groupId}/join`),

  joinByToken: (token: string) =>
    api.post<Group>(`/api/groups/join/${token}`),

  messages: {
    list: (groupId: string) =>
      api.get<GroupMessage[]>(`/api/groups/${groupId}/messages`),
    send: (groupId: string, content: string) =>
      api.post<GroupMessage>(`/api/groups/${groupId}/messages`, { content }),
    edit: (groupId: string, messageId: string, content: string) =>
      api.put<GroupMessage>(`/api/groups/${groupId}/messages/${messageId}`, { content }),
    remove: (groupId: string, messageId: string) =>
      api.delete<void>(`/api/groups/${groupId}/messages/${messageId}`),
    listPinned: (groupId: string) =>
      api.get<GroupMessage[]>(`/api/groups/${groupId}/pinned-messages`),
    pin: (groupId: string, messageId: string) =>
      api.post<void>(`/api/groups/${groupId}/messages/${messageId}/pin`),
    unpin: (groupId: string, messageId: string) =>
      api.delete<void>(`/api/groups/${groupId}/messages/${messageId}/pin`),
  },

  members: {
    list: (groupId: string) =>
      api.get<GroupMember[]>(`/api/groups/${groupId}/members`),
    add: (groupId: string, userId: string, role: GroupRole = "GUEST") =>
      api.post<GroupMember>(`/api/groups/${groupId}/members`, { userId, role }),
    kick: (groupId: string, userId: string) =>
      api.delete<void>(`/api/groups/${groupId}/members/${userId}`),
    changeRole: (groupId: string, userId: string, role: GroupRole) =>
      api.put<GroupMember>(`/api/groups/${groupId}/members/${userId}/role`, { role }),
    mute: (groupId: string, userId: string, mutedUntil?: string) =>
      api.put<void>(`/api/groups/${groupId}/members/${userId}/mute`, mutedUntil ? { mutedUntil } : {}),
    unmute: (groupId: string, userId: string) =>
      api.delete<void>(`/api/groups/${groupId}/members/${userId}/mute`),
  },

  settings: {
    patch: (groupId: string, whoCanTalk: GroupTalkPermission) =>
      api.patch<void>(`/api/groups/${groupId}/settings`, { whoCanTalk }),
  },

  inviteLinks: {
    create: (
      groupId: string,
      payload: { targetRole: "MODERATOR" | "GUEST"; expiresAt?: string; maxUses?: number }
    ) => api.post<GroupInviteLink>(`/api/groups/${groupId}/invite-links`, payload),
    list: (groupId: string) =>
      api.get<GroupInviteLink[]>(`/api/groups/${groupId}/invite-links`),
    remove: (groupId: string, inviteId: string) =>
      api.delete<void>(`/api/groups/${groupId}/invite-links/${inviteId}`),
  },
}

