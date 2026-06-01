import { api } from "@/lib/api"

export interface UserAnalytics {
  profileViews?: number
  likesReceived?: number
  commentsReceived?: number
  newFollowers?: number
  repostsReceived?: number
  bookmarksReceived?: number
  postsCount?: number
  engagementRate?: number
}

export const profileAnalyticsService = {
  async getMine(): Promise<UserAnalytics> {
    try {
      return await api.get<UserAnalytics>("/api/profile/me/analytics")
    } catch {
      return {}
    }
  },
}
