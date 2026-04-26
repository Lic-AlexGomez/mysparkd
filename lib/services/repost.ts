import { api } from "@/lib/api"

export interface RepostItem {
  repostId: string
  postId: string
  userId: string
  username?: string
  profilePictureUrl?: string | null
  comment?: string | null
  createdAt?: string
}

type RepostCacheEntry = {
  loaded: boolean
  reposters: RepostItem[]
}

class RepostService {
  private cache = new Map<string, RepostCacheEntry>()

  private toArray(payload: unknown): RepostItem[] {
    if (!Array.isArray(payload)) return []
    return payload
      .map((item) => {
        if (!item || typeof item !== "object") return null
        const row = item as Partial<RepostItem>
        const repostId = String(row.repostId || "").trim()
        const postId = String(row.postId || "").trim()
        const userId = String(row.userId || "").trim()
        if (!repostId || !postId || !userId) return null
        return {
          repostId,
          postId,
          userId,
          username: row.username || undefined,
          profilePictureUrl: row.profilePictureUrl ?? null,
          comment: row.comment ?? null,
          createdAt: row.createdAt,
        } satisfies RepostItem
      })
      .filter(Boolean) as RepostItem[]
  }

  private upsertCache(postId: string, reposters: RepostItem[]) {
    this.cache.set(postId, { loaded: true, reposters })
  }

  async listReposters(postId: string, options?: { force?: boolean }): Promise<RepostItem[]> {
    const cached = this.cache.get(postId)
    if (!options?.force && cached?.loaded) return cached.reposters

    const rows = await api.get<unknown>(`/api/posts/${postId}/reposts`)
    const reposters = this.toArray(rows)
    this.upsertCache(postId, reposters)
    return reposters
  }

  async hasReposted(postId: string, userId: string): Promise<boolean> {
    const reposters = await this.listReposters(postId)
    return reposters.some((row) => row.userId === userId)
  }

  async createRepost(postId: string, comment?: string): Promise<RepostItem> {
    const payload = comment?.trim() ? { comment: comment.trim() } : undefined
    const created = await api.post<RepostItem>(`/api/posts/${postId}/repost`, payload)
    const createdRow = {
      repostId: String(created?.repostId || ""),
      postId: String(created?.postId || postId),
      userId: String(created?.userId || ""),
      username: created?.username,
      profilePictureUrl: created?.profilePictureUrl ?? null,
      comment: created?.comment ?? null,
      createdAt: created?.createdAt,
    }

    const cached = this.cache.get(postId)
    if (cached?.loaded) {
      const next = [createdRow, ...cached.reposters.filter((item) => item.userId !== createdRow.userId)]
      this.upsertCache(postId, next)
    }

    return createdRow
  }

  async removeRepost(postId: string, userId?: string): Promise<void> {
    await api.delete(`/api/posts/${postId}/repost`)
    const cached = this.cache.get(postId)
    if (cached?.loaded) {
      const next = userId
        ? cached.reposters.filter((item) => item.userId !== userId)
        : cached.reposters
      this.upsertCache(postId, next)
    }
  }
}

export const repostService = new RepostService()
