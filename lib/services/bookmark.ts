class BookmarkService {
  private bookmarks = new Map<string, Set<string>>()

  constructor() {
    this.loadBookmarks()
  }

  private loadBookmarks() {
    const saved = localStorage.getItem('sparkd_bookmarks')
    if (saved) {
      const data = JSON.parse(saved)
      Object.entries(data).forEach(([userId, postIds]) => {
        this.bookmarks.set(userId, new Set(postIds as string[]))
      })
    }
  }

  private saveBookmarks() {
    const data: Record<string, string[]> = {}
    this.bookmarks.forEach((postIds, userId) => {
      data[userId] = Array.from(postIds)
    })
    localStorage.setItem('sparkd_bookmarks', JSON.stringify(data))
  }

  toggleBookmark(userId: string, postId: string): boolean {
    if (!this.bookmarks.has(userId)) {
      this.bookmarks.set(userId, new Set())
    }
    const userBookmarks = this.bookmarks.get(userId)!
    
    if (userBookmarks.has(postId)) {
      userBookmarks.delete(postId)
      this.saveBookmarks()
      return false
    } else {
      userBookmarks.add(postId)
      this.saveBookmarks()
      return true
    }
  }

  isBookmarked(userId: string, postId: string): boolean {
    return this.bookmarks.get(userId)?.has(postId) || false
  }

  getBookmarkedPosts(userId: string): string[] {
    return Array.from(this.bookmarks.get(userId) || [])
  }
}

export const bookmarkService = new BookmarkService()
