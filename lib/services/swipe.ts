import { api } from "@/lib/api"
import type { UserProfile } from "@/lib/types"

export type RewindResponse = {
  restoredUserId?: string
  swipesRemaining?: number
}

export const swipeService = {
  async rewind(): Promise<RewindResponse | null> {
    try {
      return await api.post<RewindResponse>("/api/swipes/rewind")
    } catch {
      return null
    }
  },

  async getILiked(): Promise<UserProfile[]> {
    try {
      const rows = await api.get<unknown>("/api/swipes/i-liked")
      return Array.isArray(rows) ? (rows as UserProfile[]) : []
    } catch {
      return []
    }
  },

  async getIDisliked(): Promise<UserProfile[]> {
    try {
      const rows = await api.get<unknown>("/api/swipes/i-disliked")
      return Array.isArray(rows) ? (rows as UserProfile[]) : []
    } catch {
      return []
    }
  },
}
