import type { Post } from "@/lib/types"

const TTL_MS = 3 * 60 * 1000

type GlobalFeedCache = {
  sortMode: string
  posts: Post[]
  hasMore: boolean
  page: number
  useServerPagination: boolean
  visibleCount: number
  fetchedAt: number
}

let globalFeedCache: GlobalFeedCache | null = null

export function readGlobalFeedCache(sortMode: string): GlobalFeedCache | null {
  if (!globalFeedCache || globalFeedCache.sortMode !== sortMode) return null
  if (Date.now() - globalFeedCache.fetchedAt > TTL_MS) return null
  return globalFeedCache
}

export function writeGlobalFeedCache(
  sortMode: string,
  data: Pick<
    GlobalFeedCache,
    "posts" | "hasMore" | "page" | "useServerPagination" | "visibleCount"
  >
) {
  globalFeedCache = { sortMode, ...data, fetchedAt: Date.now() }
}

export function clearGlobalFeedCache() {
  globalFeedCache = null
}
