"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { api } from '@/lib/api'
import { normalizePost } from '@/lib/normalize-post'
import { feedService, FEED_PAGE_SIZE } from '@/lib/services/feed'
import type { Post } from '@/lib/types'

type SortMode = 'chronological' | 'relevant' | 'compatible' | 'top'

/**
 * Feed global Sparkd: `FeedController` → `GET /api/feed/feed` (JWT requerido).
 * No añadir `/api/feed/foryou` ni `/api/posts/feed` salvo existan en tu API:
 * en Sparkd1.0 no están definidos y solo generan 404.
 */
const GLOBAL_FEED_PATH = '/api/feed/feed' as const

const FEED_DEBUG =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development'

function feedDebug(...args: unknown[]) {
  if (FEED_DEBUG) console.log('[useFeed]', ...args)
}

type PaginatedFeedResponse = {
  content?: any[]
  last?: boolean
  totalPages?: number
}

function extractPageRowsFromPayload(data: any): { rows: any[]; hint: string } {
  if (data == null) return { rows: [], hint: 'null' }
  if (Array.isArray(data)) return { rows: data, hint: 'array' }
  if (Array.isArray(data.content)) return { rows: data.content, hint: 'content' }
  if (Array.isArray(data.data?.content)) return { rows: data.data.content, hint: 'data.content' }
  if (Array.isArray(data.posts)) return { rows: data.posts, hint: 'posts' }
  if (Array.isArray(data.records)) return { rows: data.records, hint: 'records' }
  if (FEED_DEBUG) {
    console.warn('[useFeed] Formato de página desconocido, keys:', Object.keys(data))
  }
  return { rows: [], hint: 'unknown' }
}

type PrefetchedPage = {
  page: number
  posts: Post[]
  hasMore: boolean
}

export function useFeed() {
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE_SIZE)
  const [useServerPagination, setUseServerPagination] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('chronological')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const prefetchedPageRef = useRef<PrefetchedPage | null>(null)
  const prefetchPromiseRef = useRef<Promise<void> | null>(null)
  const prefetchEpochRef = useRef(0)
  /** Sparkd Moments → compatible-sort affinity (0–15). */
  const momentAffinityRef = useRef(0)
  /** City Pulse → livability bias for relevant / compatible (0–10). */
  const cityPulseBoostRef = useRef(0)

  const fetchMomentsAffinityHint = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("sparkd_token") : null
      if (!token) return
      const r = await fetch("/api/moments/recommendation-hint", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) return
      const j = (await r.json()) as { affinity_boost?: number }
      if (typeof j.affinity_boost === "number") momentAffinityRef.current = j.affinity_boost
    } catch {
      /* noop */
    }
  }, [])

  const fetchCityPulseBoost = useCallback(async () => {
    try {
      let lat: number | undefined
      let lng: number | undefined
      const raw =
        typeof window !== "undefined" ? window.localStorage.getItem("sparkd_location") : null
      if (raw) {
        try {
          const j = JSON.parse(raw) as { latitude?: number; longitude?: number }
          if (typeof j.latitude === "number" && typeof j.longitude === "number") {
            lat = j.latitude
            lng = j.longitude
          }
        } catch {
          /* ignore */
        }
      }
      if (lat == null || lng == null) return

      const token = typeof window !== "undefined" ? localStorage.getItem("sparkd_token") : null
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const r = await fetch(
        `/api/city/pulse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
        { headers }
      )
      if (!r.ok) return
      const j = (await r.json()) as { recommendation_boost?: number }
      if (typeof j.recommendation_boost === "number") cityPulseBoostRef.current = j.recommendation_boost
    } catch {
      /* noop */
    }
  }, [])

  const sortWithMoments = useCallback((posts: Post[], mode: SortMode) => {
    return feedService.sortPosts(posts, mode, undefined, {
      momentAffinityBoost: momentAffinityRef.current,
      cityPulseBoost: cityPulseBoostRef.current,
    })
  }, [])
  const normalizeFeedItems = useCallback((items: any[]) => {
    const mapped = items.map(normalizePost)
    const out = mapped.filter((p) => {
      if (p.locked) return true
      return !(p.message && !p.body && !p.file)
    })
    if (
      FEED_DEBUG &&
      items.length > 0 &&
      out.length === 0
    ) {
      console.warn(
        '[useFeed] Se recibieron',
        items.length,
        'filas del API pero todas se descartaron (message-only / sin id?). Muestra:',
        items[0]
      )
    }
    if (FEED_DEBUG && items.length > 0 && out.length > 0 && out.some((p) => !p.id)) {
      console.warn('[useFeed] Hay posts sin id; revisa si el DTO usa otro campo (postId).', out[0])
    }
    return out
  }, [])

  const mergeUniquePosts = useCallback((current: Post[], incoming: Post[]) => {
    const seen = new Set(current.map((p) => p.id))
    const merged = [...current]
    for (const p of incoming) {
      if (!seen.has(p.id)) {
        seen.add(p.id)
        merged.push(p)
      }
    }
    return merged
  }, [])

  const parseFeedPagePayload = useCallback(
    (data: any[] | PaginatedFeedResponse, targetPage: number) => {
      if (Array.isArray(data)) {
        return {
          posts: normalizeFeedItems(data),
          hasMore: false,
          isPaginated: false,
        }
      }

      const { rows, hint } = extractPageRowsFromPayload(data as any)
      if (FEED_DEBUG && !Array.isArray(data) && (data as any)?.content === undefined) {
        feedDebug('parse: extrayendo filas desde', hint, 'count=', rows.length)
      }

      const raw = data as Record<string, unknown> | null
      const rowsLegacy = Array.isArray(raw?.content) ? (raw.content as any[]) : []
      const useRows = rows.length > 0 ? rows : rowsLegacy
      const totalPages =
        typeof raw?.totalPages === 'number'
          ? raw.totalPages
          : typeof (raw as any)?.total_pages === 'number'
            ? (raw as any).total_pages
            : undefined
      const last =
        typeof raw?.last === 'boolean'
          ? raw.last
          : typeof totalPages === 'number'
            ? targetPage >= totalPages - 1
            : useRows.length < FEED_PAGE_SIZE

      return {
        posts: normalizeFeedItems(useRows),
        hasMore: !last,
        isPaginated: true,
      }
    },
    [normalizeFeedItems]
  )

  const fetchFeedPathPage = useCallback(
    async (path: string, targetPage: number) => {
      const data = await api.getPage<any[] | PaginatedFeedResponse>(
        `${path}?page=${targetPage}&size=${FEED_PAGE_SIZE}`
      )
      if (FEED_DEBUG) {
        const p = data as Record<string, unknown> | unknown[]
        const preview = Array.isArray(p)
          ? `array length=${p.length}`
          : p && typeof p === 'object'
            ? `keys=${Object.keys(p as object).join(',')}`
            : String(p)
        feedDebug('GET respuesta cruda', `${path}?page=${targetPage}`, preview)
      }
      return parseFeedPagePayload(data, targetPage)
    },
    [parseFeedPagePayload]
  )

  const fetchServerPage = useCallback(
    async (targetPage: number) => {
      feedDebug('GET', GLOBAL_FEED_PATH, 'page=', targetPage)
      const out = await fetchFeedPathPage(GLOBAL_FEED_PATH, targetPage)
      feedDebug(
        '  posts=',
        out.posts.length,
        'hasMore=',
        out.hasMore,
        'paginated=',
        out.isPaginated
      )
      return out
    },
    [fetchFeedPathPage]
  )

  const prefetchServerPage = useCallback(async (targetPage: number, epoch: number) => {
    if (prefetchedPageRef.current?.page === targetPage) return
    if (prefetchPromiseRef.current) {
      await prefetchPromiseRef.current
      if (prefetchedPageRef.current?.page === targetPage) return
    }

    const task = (async () => {
      try {
        const response = await fetchServerPage(targetPage)
        if (epoch !== prefetchEpochRef.current) return
        if (!response.isPaginated) return

        prefetchedPageRef.current = {
          page: targetPage,
          posts: sortWithMoments(response.posts, sortMode),
          hasMore: response.hasMore,
        }
      } catch {
        // Ignore prefetch errors; regular loadMore will handle fallback.
      } finally {
        prefetchPromiseRef.current = null
      }
    })()

    prefetchPromiseRef.current = task
    await task
  }, [fetchServerPage, sortMode, sortWithMoments])

  // Actualizar ubicación en background al cargar el feed
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        api.post('/api/feed/location', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }).catch(() => {})
      },
      () => {} // silent si el usuario deniega
    )
  }, [])

  const loadPosts = useCallback(async () => {
    // Cancelar request anterior si existe
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    prefetchEpochRef.current += 1
    const epoch = prefetchEpochRef.current
    prefetchedPageRef.current = null
    prefetchPromiseRef.current = null

    try {
      setLoading(true)
      const [firstPage] = await Promise.all([
        fetchServerPage(0),
        fetchMomentsAffinityHint(),
        fetchCityPulseBoost(),
      ])
      const sortedFirst = sortWithMoments(firstPage.posts, sortMode)
      feedDebug('loadPosts primera página:', {
        count: sortedFirst.length,
        isPaginated: firstPage.isPaginated,
        hasMore: firstPage.hasMore,
        sortMode,
        endpoint: GLOBAL_FEED_PATH,
      })
      if (sortedFirst.length === 0) {
        console.warn(
          '[useFeed] 0 publicaciones. Endpoint: GET /api/feed/feed (vía /api/proxy). En Red mira status y body: ¿content vacío, 401, o error?'
        )
      }

      if (firstPage.isPaginated) {
        setUseServerPagination(true)
        setAllPosts(sortedFirst)
        setPage(0)
        setHasMore(firstPage.hasMore)
        setVisibleCount(FEED_PAGE_SIZE)
        if (firstPage.hasMore) {
          void prefetchServerPage(1, epoch)
        }
        return
      }

      // Fallback: backend sin paginación. Mostramos incrementalmente en frontend.
      const sortedAll = sortWithMoments(firstPage.posts, sortMode)
      setUseServerPagination(false)
      setAllPosts(sortedAll)
      setVisibleCount(FEED_PAGE_SIZE)
      setPage(0)
      setHasMore(sortedAll.length > FEED_PAGE_SIZE)
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        feedDebug('loadPosts error:', error)
        setAllPosts([])
        setVisibleCount(FEED_PAGE_SIZE)
        setPage(0)
        setHasMore(false)
        prefetchedPageRef.current = null
        prefetchPromiseRef.current = null
      }
    } finally {
      setLoading(false)
    }
  }, [
    sortMode,
    fetchServerPage,
    prefetchServerPage,
    sortWithMoments,
    fetchMomentsAffinityHint,
    fetchCityPulseBoost,
  ])

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return

    if (!useServerPagination) {
      setVisibleCount((prev) => {
        const next = Math.min(prev + FEED_PAGE_SIZE, allPosts.length)
        if (next >= allPosts.length) setHasMore(false)
        return next
      })
      return
    }

    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const epoch = prefetchEpochRef.current

      if (prefetchPromiseRef.current) {
        await prefetchPromiseRef.current
      }

      let nextChunk = prefetchedPageRef.current
      if (!nextChunk || nextChunk.page !== nextPage) {
        const response = await fetchServerPage(nextPage)
        nextChunk = {
          page: nextPage,
          posts: sortWithMoments(response.posts, sortMode),
          hasMore: response.hasMore,
        }
      }

      setAllPosts((prev) => sortWithMoments(mergeUniquePosts(prev, nextChunk.posts), sortMode))
      setPage(nextPage)
      setHasMore(nextChunk.hasMore)
      prefetchedPageRef.current = null
      if (nextChunk.hasMore) {
        void prefetchServerPage(nextPage + 1, epoch)
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [
    loading,
    loadingMore,
    hasMore,
    useServerPagination,
    allPosts.length,
    page,
    fetchServerPage,
    sortMode,
    mergeUniquePosts,
    prefetchServerPage,
    sortWithMoments,
  ])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadPosts()
    setRefreshing(false)
  }, [loadPosts])

  const changeSortMode = useCallback((mode: SortMode) => {
    setSortMode(mode)
    setAllPosts((prev) => sortWithMoments(prev, mode))
  }, [sortWithMoments])

  useEffect(() => {
    loadPosts()
    return () => abortRef.current?.abort()
  }, [loadPosts])

  const posts = useMemo(() => {
    if (useServerPagination) return allPosts
    return allPosts.slice(0, visibleCount)
  }, [useServerPagination, allPosts, visibleCount])

  return { posts, sortMode, loading, loadingMore, hasMore, refreshing, onRefresh, changeSortMode, loadMore }
}
