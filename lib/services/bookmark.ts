import { api } from '@/lib/api'

class BookmarkService {
  private bookmarks = new Map<string, Set<string>>()
  private loaded = new Set<string>()

  private async loadBookmarks(userId: string) {
    try {
      const data = await api.get<any[]>(`/api/bookmarks/${userId}`)
      // Normalize to array of postIds
      const ids = (Array.isArray(data)
        ? data
        : []) as any[]
      const postIds = ids.map((b) => (typeof b === 'string' ? b : b.postId ?? '')).filter((id) => !!id)
      this.bookmarks.set(userId, new Set(postIds))
    } catch {
      this.bookmarks.set(userId, new Set())
    }
    this.loaded.add(userId)
  }

  private async ensureLoaded(userId: string) {
    if (!this.loaded.has(userId)) {
      await this.loadBookmarks(userId)
    }
  }

  async toggleBookmark(userId: string, postId: string): Promise<boolean> {
    await this.ensureLoaded(userId)
    const current = this.bookmarks.get(userId) ?? new Set<string>()
    if (current.has(postId)) {
      // Attempt to remove using backend if possible
      try {
        // Try to fetch existing bookmarks to find bookmarkId for deletion
        const data = await api.get<any[]>(`/api/bookmarks/${userId}`)
        const found = Array.isArray(data) ? data.find((b) => (typeof b === 'string' ? b === postId : b.postId === postId)) : null
        const bookmarkId = found && (typeof found === 'string' ? found : found.bookmarkId)
        if (bookmarkId) {
          await api.delete(`/api/bookmarks/${bookmarkId}`)
        }
      } catch {
        // ignore if endpoint not available
      }
      current.delete(postId)
      this.bookmarks.set(userId, current)
      return false
    } else {
      try {
        await api.post('/api/bookmarks', { userId, postId })
      } catch {
        // ignore
      }
      current.add(postId)
      this.bookmarks.set(userId, current)
      return true
    }
  }

  isBookmarked(userId: string, postId: string): boolean {
    return this.bookmarks.get(userId)?.has(postId) ?? false
  }

  getBookmarkedPosts(userId: string): string[] {
    return Array.from(this.bookmarks.get(userId) ?? [])
  }
}

export const bookmarkService = new BookmarkService()
