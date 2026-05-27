import type { Post, UserProfile } from "../types"
import { api } from "@/lib/api"

export interface HashtagResult {
  id?: string
  tag: string
  usageCount: number
  previewUrls?: string[]
}

export interface PagedResponse<T> {
  content: T[]
  totalPages: number
  number: number
}

const normalizePaged = <T>(payload: any): PagedResponse<T> => {
  if (Array.isArray(payload)) {
    return {
      content: payload as T[],
      totalPages: 1,
      number: 0,
    }
  }
  return {
    content: Array.isArray(payload?.content) ? payload.content : [],
    totalPages: typeof payload?.totalPages === "number" ? payload.totalPages : 1,
    number: typeof payload?.number === "number" ? payload.number : 0,
  }
}

const normalizeHashtags = (rows: any[]): HashtagResult[] =>
  rows
    .map((h: any) => ({
      id: String(h?.id || ""),
      tag: String(h?.tag || h?.name || "").replace(/^#/, ""),
      usageCount: Number(h?.usageCount || h?.count || h?.postsCount || 0),
      previewUrls: Array.isArray(h?.previewUrls) ? h.previewUrls : undefined,
    }))
    .filter((h) => Boolean(h.tag))

export const searchService = {
  normalizeInterestLabel(interest: unknown): string {
    if (typeof interest === "string") return interest
    if (interest && typeof interest === "object") {
      const i = interest as { name?: string; interestId?: string }
      return i.name || i.interestId || ""
    }
    return ""
  },

  async searchUsers(query: string, page = 0, size = 10): Promise<PagedResponse<UserProfile>> {
    const q = query.trim()
    if (!q) return { content: [], totalPages: 1, number: 0 }

    try {
      const data = await api.get<any>(
        `/api/search/users?query=${encodeURIComponent(q)}&page=${page}&size=${size}`
      )
      return normalizePaged<UserProfile>(data)
    } catch {
      // Fallback compatible con backend legado.
      try {
        const res = await api.get<any>(`/api/search/autocomplete?q=${encodeURIComponent("@" + q)}`)
        const users = Array.isArray(res?.users) ? res.users : []
        return {
          content: users as UserProfile[],
          totalPages: 1,
          number: 0,
        }
      } catch {
        return { content: [], totalPages: 1, number: 0 }
      }
    }
  },

  async searchPosts(query: string, page = 0, size = 10): Promise<PagedResponse<Post>> {
    const q = query.trim()
    if (!q) return { content: [], totalPages: 1, number: 0 }

    try {
      const data = await api.get<any>(
        `/api/search/posts?query=${encodeURIComponent(q)}&page=${page}&size=${size}`
      )
      return normalizePaged<Post>(data)
    } catch {
      // Fallback: endpoint general.
      try {
        const res = await api.get<any>(`/api/search/general?query=${encodeURIComponent(q)}`)
        const posts = Array.isArray(res?.posts) ? res.posts : []
        return {
          content: posts as Post[],
          totalPages: 1,
          number: 0,
        }
      } catch {
        return { content: [], totalPages: 1, number: 0 }
      }
    }
  },

  async searchHashtags(query: string): Promise<HashtagResult[]> {
    const q = query.trim().replace(/^#/, "")
    if (!q) return []

    try {
      const data = await api.get<any[]>(`/api/search/hashtags?query=${encodeURIComponent(q)}`)
      return normalizeHashtags(Array.isArray(data) ? data : [])
    } catch {
      try {
        const res = await api.get<any>(`/api/search/general?query=${encodeURIComponent(q)}`)
        return normalizeHashtags(Array.isArray(res?.hashtags) ? res.hashtags : [])
      } catch {
        return []
      }
    }
  },

  async getTrendingHashtags(limit = 10): Promise<HashtagResult[]> {
    try {
      const data = await api.get<any[]>(`/api/hashtags/trending?limit=${limit}`)
      return normalizeHashtags(Array.isArray(data) ? data : [])
    } catch {
      try {
        const data = await api.get<any[]>(`/api/search/hashtags/trending?limit=${limit}`)
        return normalizeHashtags(Array.isArray(data) ? data : [])
      } catch {
        return []
      }
    }
  },

  async getPostsByHashtag(tag: string, page = 0, size = 20): Promise<PagedResponse<Post>> {
    const cleanTag = tag.trim().replace(/^#/, "")
    if (!cleanTag) return { content: [], totalPages: 1, number: 0 }

    try {
      const data = await api.get<any>(
        `/api/hashtags/${encodeURIComponent(cleanTag)}/posts?page=${page}&size=${size}`
      )
      return normalizePaged<Post>(data)
    } catch {
      try {
        const data = await api.get<any>(
          `/api/search/hashtags/${encodeURIComponent(cleanTag)}/posts?page=${page}&size=${size}`
        )
        return normalizePaged<Post>(data)
      } catch {
        return { content: [], totalPages: 1, number: 0 }
      }
    }
  },

  async autocomplete(query: string): Promise<{ users: UserProfile[]; posts: Post[]; hashtags: HashtagResult[] }> {
    const q = query.trim()
    if (q.length < 2) return { users: [], posts: [], hashtags: [] }
    try {
      const data = await api.get<any>(`/api/search/autocomplete?q=${encodeURIComponent(q)}`)
      const users = Array.isArray(data?.users) ? data.users.map((u: any) => ({
        userId: String(u.userId || u.id || ""),
        username: String(u.username || ""),
        nombres: String(u.nombres || u.fullName || u.username || ""),
        apellidos: String(u.apellidos || ""),
        profilePictureUrl: u.profilePictureUrl || u.photo || undefined,
      } as UserProfile)) : []
      return {
        users,
        posts: Array.isArray(data?.posts) ? data.posts : [],
        hashtags: normalizeHashtags(Array.isArray(data?.hashtags) ? data.hashtags : []),
      }
    } catch {
      return { users: [], posts: [], hashtags: [] }
    }
  },

  // Helpers legacy (local filtering)
  searchUsersLocally(
    users: UserProfile[],
    query: string,
    filters?: {
      minReputation?: number
      verificationLevel?: number
      interests?: string[]
    }
  ): UserProfile[] {
    let results = users.filter(user => {
      const searchText = `${user.nombres} ${user.apellidos}`.toLowerCase()
      return searchText.includes(query.toLowerCase())
    })

    if (filters?.minReputation) {
      results = results.filter(u => (u.reputation || 0) >= filters.minReputation!)
    }

    if (filters?.verificationLevel !== undefined) {
      results = results.filter(u => (u.verificationLevel || 0) >= filters.verificationLevel!)
    }

    if (filters?.interests && filters.interests.length > 0) {
      results = results.filter(u => 
        u.interests?.some(i => filters.interests!.includes(searchService.normalizeInterestLabel(i)))
      )
    }

    return results
  },

  searchPostsLocally(posts: Post[], query: string): Post[] {
    return posts.filter(post => 
      post.body.toLowerCase().includes(query.toLowerCase()) ||
      post.username.toLowerCase().includes(query.toLowerCase())
    )
  },

  /** GET /api/search/intelligent — posts, users, hashtags en una llamada */
  async searchIntelligent(query: string): Promise<{ users: UserProfile[]; posts: Post[]; hashtags: HashtagResult[] }> {
    const q = query.trim()
    if (!q) return { users: [], posts: [], hashtags: [] }
    try {
      const data = await api.get<any>(`/api/search/intelligent?query=${encodeURIComponent(q)}`)
      const users = Array.isArray(data?.users)
        ? data.users.map((u: any) => ({
            userId: String(u.userId || u.id || ""),
            username: String(u.username || ""),
            nombres: String(u.nombres || u.fullName || u.username || ""),
            apellidos: String(u.apellidos || ""),
            profilePictureUrl: u.profilePictureUrl || u.photo || undefined,
          } as UserProfile))
        : []
      return {
        users,
        posts: Array.isArray(data?.posts) ? data.posts : [],
        hashtags: normalizeHashtags(Array.isArray(data?.hashtags) ? data.hashtags : []),
      }
    } catch {
      return this.autocomplete(q)
    }
  },
}
