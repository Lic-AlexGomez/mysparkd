/**
 * Cliente del “sistema de repost” (backend vía `lib/api` → `/api/proxy/...` → `NEXT_PUBLIC_API_URL`).
 *
 * Endpoints esperados en el backend:
 * - POST   `/api/posts/{postId}/repost` — cuerpo opcional, p. ej. `{ comment?: string }`
 * - DELETE `/api/posts/{postId}/repost`
 * - GET    `/api/posts/{postId}/reposts` — lista de quien reposteó (no hay pantalla admin en este repo;
 *   aquí se usa sobre todo para `hasReposted` / caché en `PostCard`. Si el listado es solo para
 *   operadores, puede consumirse desde herramientas externas o una futura ruta admin.)
 */
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

  /** Acepta array JSON o envoltorios habituales (`content`, `data`, `reposts`, `items`). */
  private unwrapListPayload(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload
    if (payload && typeof payload === "object") {
      const o = payload as Record<string, unknown>
      for (const key of ["content", "data", "reposts", "items"] as const) {
        const v = o[key]
        if (Array.isArray(v)) return v
      }
    }
    return []
  }

  private toArray(payload: unknown): RepostItem[] {
    const rows = this.unwrapListPayload(payload)
    return rows
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

  async getMyReposts(page = 0, size = 20): Promise<{ items: RepostItem[]; hasMore: boolean }> {
    try {
      const data = await api.getPage<unknown>(`/api/me/reposts?page=${page}&size=${size}`)
      const rows = this.unwrapListPayload(data)
      const items = this.toArray(rows)
      const last =
        data && typeof data === "object" && typeof (data as { last?: boolean }).last === "boolean"
          ? (data as { last: boolean }).last
          : items.length < size
      return { items, hasMore: !last }
    } catch {
      return { items: [], hasMore: false }
    }
  }
}

export const repostService = new RepostService()
