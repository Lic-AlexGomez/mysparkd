import { api } from '../api'
import { isDisplayableFeedPost, normalizePost } from '../normalize-post'
import type { Post } from '../types'

export const FEED_PAGE_SIZE = 12

type SortMode = 'chronological' | 'relevant' | 'compatible' | 'top'

type PaginatedFollowingResponse = {
  content?: any[]
  last?: boolean
  totalPages?: number
}

function filterDisplayable(post: Post) {
  return isDisplayableFeedPost(post)
}

function extractFollowingRows(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.posts)) return data.posts
  if (Array.isArray(data?.data)) return data.data
  return []
}

function parseFollowingPage(
  data: any[] | PaginatedFollowingResponse,
  targetPage: number,
  pageSize: number
): { posts: Post[]; hasMore: boolean; isPaginated: boolean } {
  if (Array.isArray(data)) {
    const posts = data.map(normalizePost).filter(filterDisplayable)
    return { posts, hasMore: false, isPaginated: false }
  }

  const rows = extractFollowingRows(data)
  const totalPages = typeof data?.totalPages === 'number' ? data.totalPages : undefined
  const last =
    typeof data?.last === 'boolean'
      ? data.last
      : typeof totalPages === 'number'
        ? targetPage >= totalPages - 1
        : rows.length < pageSize

  const posts = rows.map(normalizePost).filter(filterDisplayable)
  return {
    posts,
    hasMore: !last,
    isPaginated: true,
  }
}

export const feedService = {
  async getFollowingPage(
    page: number,
    size: number = FEED_PAGE_SIZE
  ): Promise<{ posts: Post[]; hasMore: boolean; isPaginated: boolean }> {
    const data = await api.get<any[] | PaginatedFollowingResponse>(
      `/api/feed/following?page=${page}&size=${size}`
    )
    return parseFollowingPage(data, page, size)
  },

  /** Primera página; preferir `getFollowingPage` para paginación. */
  async getFollowingFeed(): Promise<Post[]> {
    const { posts } = await this.getFollowingPage(0, FEED_PAGE_SIZE)
    return posts
  },

  sortPosts(
    posts: Post[],
    mode: SortMode,
    currentUserId?: string,
    opts?: { momentAffinityBoost?: number; cityPulseBoost?: number }
  ): Post[] {
    const sorted = [...posts]
    
    switch (mode) {
      case 'chronological':
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      
      case 'relevant': {
        const pulse = Number(opts?.cityPulseBoost ?? 0) || 0
        return sorted.sort((a, b) => {
          const engagementA = (a.likeCount || 0) + (a.commentsCount || 0) * 2 + (a.repostCount || 0) * 3
          const engagementB = (b.likeCount || 0) + (b.commentsCount || 0) * 2 + (b.repostCount || 0) * 3

          const timeA = new Date(a.createdAt).getTime()
          const timeB = new Date(b.createdAt).getTime()
          const now = Date.now()
          const decayA = 1 - (now - timeA) / (1000 * 60 * 60 * 24 * 7)
          const decayB = 1 - (now - timeB) / (1000 * 60 * 60 * 24 * 7)

          const bump = (eng: number) =>
            1 + Math.min(0.22, pulse / 110) * Math.min(1, eng / 35)

          const scoreA = engagementA * Math.max(0.1, decayA) * bump(engagementA)
          const scoreB = engagementB * Math.max(0.1, decayB) * bump(engagementB)

          return scoreB - scoreA
        })
      }
      
      case 'compatible': {
        const momentBoost = Number(opts?.momentAffinityBoost ?? 0) || 0
        const pulseBoost = Number(opts?.cityPulseBoost ?? 0) || 0
        const blendBoost = momentBoost + pulseBoost * 0.85
        return sorted.sort((aPost, bPost) => {
          const hotA = (aPost.likeCount || 0) + (aPost.commentsCount || 0)
          const hotB = (bPost.likeCount || 0) + (bPost.commentsCount || 0)
          const repA =
            (aPost.reputation || 50) +
            (aPost.verificationLevel || 0) * 10 +
            blendBoost * Math.min(1, hotA / 20)
          const repB =
            (bPost.reputation || 50) +
            (bPost.verificationLevel || 0) * 10 +
            blendBoost * Math.min(1, hotB / 20)
          return repB - repA
        })
      }
      
      case 'top':
        return sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      
      default:
        return sorted
    }
  }
}
