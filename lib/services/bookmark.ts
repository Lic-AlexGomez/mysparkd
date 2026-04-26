import { api } from "@/lib/api"
import type { Post } from "@/lib/types"

type BookmarkToggleResponse = {
  postId?: string
  saved?: boolean
}

type PageResponse<T> = {
  content?: T[]
  number?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
}

export interface BookmarkItem {
  postId: string
  bookmarkId: null
}

export interface SavedPostsPage {
  content: Post[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

class BookmarkService {
  private savedPostIds = new Set<string>()

  private resolvePostId(userIdOrPostId: string, maybePostId?: string): string {
    return (maybePostId ?? userIdOrPostId).trim()
  }

  private setSaved(postId: string, saved: boolean) {
    if (saved) {
      this.savedPostIds.add(postId)
      return
    }
    this.savedPostIds.delete(postId)
  }

  private normalizePageResponse(response: unknown, page: number, size: number): SavedPostsPage {
    const raw = (response ?? {}) as PageResponse<Post> | Post[]
    const content = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.content)
        ? raw.content
        : []
    const normalizedContent = content.map((post) => ({ ...post, saved: true }))

    for (const post of normalizedContent) {
      if (post?.id) this.savedPostIds.add(post.id)
    }

    if (Array.isArray(raw)) {
      return {
        content: normalizedContent,
        page,
        size,
        totalElements: normalizedContent.length,
        totalPages: normalizedContent.length > 0 ? 1 : 0,
        last: true,
      }
    }

    return {
      content: normalizedContent,
      page: raw.number ?? page,
      size: raw.size ?? size,
      totalElements: raw.totalElements ?? normalizedContent.length,
      totalPages: raw.totalPages ?? (normalizedContent.length > 0 ? 1 : 0),
      last: raw.last ?? true,
    }
  }

  async toggleBookmark(userIdOrPostId: string, maybePostId?: string): Promise<boolean> {
    const postId = this.resolvePostId(userIdOrPostId, maybePostId)
    if (!postId) throw new Error("postId es requerido para toggle bookmark")

    const response = await api.post<BookmarkToggleResponse>("/api/bookmarks/toggle", { postId })
    const saved = Boolean(response?.saved)
    this.setSaved(postId, saved)
    return saved
  }

  async getSavedPosts(page = 0, size = 20): Promise<SavedPostsPage> {
    const response = await api.get<PageResponse<Post>>(`/api/bookmarks?page=${page}&size=${size}`)
    return this.normalizePageResponse(response, page, size)
  }

  async list(_userId?: string): Promise<BookmarkItem[]> {
    return Array.from(this.savedPostIds).map((postId) => ({ postId, bookmarkId: null }))
  }

  async refresh(_userId?: string): Promise<void> {
    this.savedPostIds.clear()
    const firstPage = await this.getSavedPosts(0, 50)
    if (firstPage.last) return

    const maxPages = Math.min(firstPage.totalPages, 10)
    for (let page = 1; page < maxPages; page += 1) {
      const next = await this.getSavedPosts(page, 50)
      if (next.last) break
    }
  }

  isBookmarked(_userId: string, postId: string): boolean {
    return this.savedPostIds.has(postId)
  }

  isSaved(postId: string): boolean {
    return this.savedPostIds.has(postId)
  }

  getBookmarkedPosts(_userId?: string): string[] {
    return Array.from(this.savedPostIds)
  }
}

export const bookmarkService = new BookmarkService()
