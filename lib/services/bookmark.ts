import { api } from '@/lib/api'

type RawBookmark = {
  bookmarkId?: string
  id?: string
  postId?: string
}

export interface BookmarkItem {
  postId: string
  bookmarkId: string | null
}

class BookmarkService {
  private bookmarks = new Map<string, Map<string, string | null>>()
  private loaded = new Set<string>()

  private normalizeBookmarkRows(rows: unknown): BookmarkItem[] {
    if (!Array.isArray(rows)) return []
    return rows
      .map((row) => {
        if (typeof row === 'string') {
          return { postId: row, bookmarkId: null }
        }
        const r = row as RawBookmark
        const postId = String(r.postId || '').trim()
        if (!postId) return null
        const bookmarkId = r.bookmarkId || r.id || null
        return { postId, bookmarkId: bookmarkId ? String(bookmarkId) : null }
      })
      .filter(Boolean) as BookmarkItem[]
  }

  private async loadBookmarks(userId: string) {
    const rows = await api.get<unknown>(`/api/bookmarks/${userId}`)
    const normalized = this.normalizeBookmarkRows(rows)
    const byPost = new Map<string, string | null>()
    for (const item of normalized) {
      byPost.set(item.postId, item.bookmarkId)
    }
    this.bookmarks.set(userId, byPost)
    this.loaded.add(userId)
  }

  private async ensureLoaded(userId: string) {
    if (!this.loaded.has(userId)) {
      await this.loadBookmarks(userId)
    }
  }

  async list(userId: string): Promise<BookmarkItem[]> {
    await this.ensureLoaded(userId)
    const current = this.bookmarks.get(userId) ?? new Map<string, string | null>()
    return Array.from(current.entries()).map(([postId, bookmarkId]) => ({ postId, bookmarkId }))
  }

  async refresh(userId: string) {
    this.loaded.delete(userId)
    await this.ensureLoaded(userId)
  }

  async toggleBookmark(userId: string, postId: string): Promise<boolean> {
    await this.ensureLoaded(userId)
    const current = this.bookmarks.get(userId) ?? new Map<string, string | null>()
    if (current.has(postId)) {
      await this.removeBookmark(userId, postId)
      return false
    }
    await this.addBookmark(userId, postId)
    return true
  }

  isBookmarked(userId: string, postId: string): boolean {
    return this.bookmarks.get(userId)?.has(postId) ?? false
  }

  getBookmarkedPosts(userId: string): string[] {
    return Array.from(this.bookmarks.get(userId)?.keys() ?? [])
  }

  private async addBookmark(userId: string, postId: string) {
    const response = await api.post<RawBookmark>('/api/bookmarks', { userId, postId })
    const bookmarkId = response?.bookmarkId || response?.id || null
    const current = this.bookmarks.get(userId) ?? new Map<string, string | null>()
    current.set(postId, bookmarkId ? String(bookmarkId) : null)
    this.bookmarks.set(userId, current)
  }

  private async removeBookmark(userId: string, postId: string) {
    const current = this.bookmarks.get(userId) ?? new Map<string, string | null>()
    let bookmarkId = current.get(postId) || null

    if (!bookmarkId) {
      await this.refresh(userId)
      bookmarkId = this.bookmarks.get(userId)?.get(postId) || null
    }

    if (bookmarkId) {
      try {
        await api.delete(`/api/bookmarks/${bookmarkId}`)
      } catch {
        await api.delete(`/api/bookmarks/post/${postId}`)
      }
    } else {
      await api.delete(`/api/bookmarks/post/${postId}`)
    }

    current.delete(postId)
    this.bookmarks.set(userId, current)
  }
}

export const bookmarkService = new BookmarkService()
