import { api } from "@/lib/api"

export type GroupAnalytics = {
  totalMembers?: number
  activeMembers?: number
  totalMessages?: number
  messagesToday?: number
  totalPolls?: number
  activePolls?: number
  topReactedMessage?: {
    messageId: string
    reactionsCount: number
    content: string
  } | null
  topVoters?: Array<{ userId: string; username: string; votesCast: number }>
  memberActivityByDay?: Array<{ date: string; messages: number; reactions: number }>
}

function normalize(raw: unknown): GroupAnalytics | null {
  if (!raw || typeof raw !== "object") return null
  return raw as GroupAnalytics
}

export const groupAnalyticsService = {
  async getForGroup(groupId: string): Promise<GroupAnalytics | null> {
    if (!groupId?.trim()) return null
    try {
      const data = await api.get<unknown>(
        `/api/groups/analytics?groupId=${encodeURIComponent(groupId)}`
      )
      return normalize(data)
    } catch {
      return null
    }
  },
}
