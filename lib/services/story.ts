import { api } from "../api"
import type { StoryGroup, StoryResponse } from "../types"

type StoryViewCountResponse = number | { viewCount?: number; count?: number; total?: number }
type StoriesEndpointResponse = StoryGroup[] | StoryGroup | StoryResponse[] | StoryResponse | null | undefined

function isStoryGroup(value: unknown): value is StoryGroup {
  return Boolean(
    value &&
    typeof value === "object" &&
    "stories" in value &&
    Array.isArray((value as StoryGroup).stories),
  )
}

function isStoryResponse(value: unknown): value is StoryResponse {
  return Boolean(value && typeof value === "object" && "mediaUrl" in value)
}

function toStoryGroup(stories: StoryResponse[], targetUserId?: string): StoryGroup {
  const firstStory = stories[0]
  return {
    userId: targetUserId || firstStory?.userId || "",
    username: firstStory?.username || "Usuario",
    profilePictureUrl: firstStory?.profilePictureUrl,
    hasUnread: stories.some((story) => !story.hasViewed),
    stories,
  }
}

function normalizeStoriesResponse(payload: StoriesEndpointResponse, targetUserId?: string): StoryGroup[] {
  if (!payload) return []

  if (Array.isArray(payload)) {
    if (payload.length === 0) return []
    if (isStoryGroup(payload[0])) return payload as StoryGroup[]
    const stories = payload.filter(isStoryResponse)
    return stories.length > 0 ? [toStoryGroup(stories, targetUserId)] : []
  }

  if (isStoryGroup(payload)) return [payload]
  if (isStoryResponse(payload)) return [toStoryGroup([payload], targetUserId)]
  return []
}

export const storyService = {
  async getFeed(): Promise<StoryGroup[]> {
    const response = await api.get<StoriesEndpointResponse>("/api/stories/feed")
    return normalizeStoriesResponse(response)
  },

  async getUserStories(targetUserId: string): Promise<StoryGroup[]> {
    const response = await api.get<StoriesEndpointResponse>(`/api/stories/user/${targetUserId}`)
    return normalizeStoriesResponse(response, targetUserId)
  },

  async getViewCount(storyId: string): Promise<number> {
    const response = await api.get<StoryViewCountResponse>(`/api/stories/${storyId}/view-count`)
    if (typeof response === "number") return response
    return response?.viewCount ?? response?.count ?? response?.total ?? 0
  },
}
