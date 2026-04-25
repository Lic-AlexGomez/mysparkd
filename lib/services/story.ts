import { api } from '../api'

type StoryViewCountResponse = number | { viewCount?: number; count?: number; total?: number }

export const storyService = {
  async getViewCount(storyId: string): Promise<number> {
    const response = await api.get<StoryViewCountResponse>(`/api/stories/${storyId}/view-count`)
    if (typeof response === 'number') return response
    return response?.viewCount ?? response?.count ?? response?.total ?? 0
  },
}
