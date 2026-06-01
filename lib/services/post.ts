import { api } from "@/lib/api"
import { normalizePost } from "@/lib/normalize-post"
import type { Post } from "@/lib/types"

export const postService = {
  async getById(postId: string): Promise<Post | null> {
    if (!postId?.trim()) return null
    try {
      const raw = await api.get<unknown>(`/api/posts/${encodeURIComponent(postId)}`)
      if (!raw || typeof raw !== "object") return null
      return normalizePost(raw)
    } catch {
      return null
    }
  },
}
