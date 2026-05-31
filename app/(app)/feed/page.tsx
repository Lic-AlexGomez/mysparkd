"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useFeed } from "@/hooks/use-feed"
import { useLocalFeed } from "@/hooks/use-local-feed"
import { locationService } from "@/lib/services/location"
import { PostCard } from "@/components/feed/post-card"
import { CreatePostDialog } from "@/components/feed/create-post-dialog"
import { StoriesBar } from "@/components/feed/stories-bar"
import { SkeletonPost } from "@/components/ui/skeleton-post"
import {
  Loader2,
  Newspaper,
  Globe,
  Users,
  Filter,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MapPin,
  Repeat2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { feedService, FEED_PAGE_SIZE } from "@/lib/services/feed"
import type { Post } from "@/lib/types"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import { useExperienceMode } from "@/hooks/use-experience-mode"
import { recommendationGraphV2Service } from "@/lib/services/recommendation-graph-v2"
import { conversionLoopService } from "@/lib/services/conversion-loop"
import { ActivityCoreStreamStrip } from "@/components/activity/activity-core-stream-strip"
import { FeedRankingStrip } from "@/components/feed/feed-ranking-strip"
import { FeedEngagementSummary } from "@/components/feed/feed-engagement-summary"
import { postService } from "@/lib/services/post"
import type { ActivityCoreExperienceMode } from "@/lib/types/activity-core-stream"

const sortOptions = [
  { value: 'chronological' as const, labelEs: 'Cronológico', labelEn: 'Chronological', icon: '🕐' },
  { value: 'relevant' as const, labelEs: 'Relevante', labelEn: 'Relevant', icon: '⚡' },
  { value: 'compatible' as const, labelEs: 'Compatible', labelEn: 'Compatible', icon: '💫' },
  { value: 'top' as const, labelEs: 'Populares', labelEn: 'Top', icon: '🔥' },
]

export default function FeedPage() {
  const { te, t } = useI18n()
  const { user } = useAuth()
  const experienceMode = useExperienceMode()
  const features = useFeatureFlags()
  const searchParams = useSearchParams()
  const highlightPostId = searchParams.get('post')
  const highlightCommentId = searchParams.get('comment')
  
  // Leer el radio del feed local desde localStorage
  const [localFeedRadius, setLocalFeedRadius] = useState(50)
  
  useEffect(() => {
    if (user?.userId) {
      const saved = localStorage.getItem(`sparkd_settings_${user.userId}`)
      if (saved) {
        const settings = JSON.parse(saved)
        setLocalFeedRadius(settings.localFeedRadius ?? 50)
      }
    }
  }, [user?.userId])

  const [pulseCoords, setPulseCoords] = useState<{ lat: number; lng: number } | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sparkd_location")
      if (!raw) return
      const j = JSON.parse(raw) as { latitude?: number; longitude?: number }
      if (typeof j.latitude === "number" && typeof j.longitude === "number") {
        setPulseCoords({ lat: j.latitude, lng: j.longitude })
      }
    } catch {
      /* ignore */
    }
  }, [user?.userId])

  useEffect(() => {
    if (!user?.userId) return
    if (typeof sessionStorage === "undefined") return
    if (sessionStorage.getItem("sparkd_graph_v2_loc")) return
    ;(async () => {
      try {
        const raw = localStorage.getItem("sparkd_location")
        if (!raw) return
        const j = JSON.parse(raw) as { latitude?: number; longitude?: number }
        if (typeof j.latitude !== "number" || typeof j.longitude !== "number") return
        await recommendationGraphV2Service.postGraphUpdate({
          viewer_signals: {
            latitude: j.latitude,
            longitude: j.longitude,
          },
        })
        sessionStorage.setItem("sparkd_graph_v2_loc", "1")
      } catch {
        /* ignore */
      }
    })()
  }, [user?.userId])

  useEffect(() => {
    if (!user?.userId) return
    conversionLoopService.track({ stage: "session" }).catch(() => {})
  }, [user?.userId])

  const { posts, sortMode, loading, loadingMore, hasMore, onRefresh, changeSortMode, loadMore } = useFeed()
  const { posts: localPosts, loading: localLoading, locationEnabled, refresh: refreshLocalFeed } = useLocalFeed(localFeedRadius)
  /** Ocultar en UI tras borrar localmente hasta que el refresco coincida con el servidor. */
  const [deletedPostIds, setDeletedPostIds] = useState(() => new Set<string>())
  const [scrollToPostId, setScrollToPostId] = useState<string | null>(null)

  const handleRefreshAndScroll = (postId?: string) => {
    if (postId) setScrollToPostId(postId)
    onRefresh()
  }

  const handleLocalRefreshAndScroll = (postId?: string) => {
    if (postId) setScrollToPostId(postId)
    refreshLocalFeed()
  }

  useEffect(() => {
    if (!scrollToPostId) return
    if (loading || localLoading) return
    const id = scrollToPostId
    let attempts = 0
    const interval = setInterval(() => {
      const el = document.getElementById(`post-${id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setScrollToPostId(null)
        clearInterval(interval)
      } else if (++attempts >= 15) {
        clearInterval(interval)
        setScrollToPostId(null)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [scrollToPostId, loading, localLoading])
  const [feedTab, setFeedTab] = useState<'global' | 'local' | 'following' | 'reshares'>('global')
  const [filterType, setFilterType] = useState<'all' | 'withImage' | 'withoutImage'>('all')
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card')
  const [followingPosts, setFollowingPosts] = useState<Post[]>([])
  const [followingLoading, setFollowingLoading] = useState(false)
  const [followingLoadingMore, setFollowingLoadingMore] = useState(false)
  const [followingPage, setFollowingPage] = useState(0)
  const [followingHasMore, setFollowingHasMore] = useState(false)
  const [followingUseServerPagination, setFollowingUseServerPagination] = useState(false)
  const [resharesPosts, setResharesPosts] = useState<Post[]>([])
  const [resharesLoading, setResharesLoading] = useState(false)
  const [pinnedHighlightPost, setPinnedHighlightPost] = useState<Post | null>(null)
  const [locationError, setLocationError] = useState(() => {
    // Verificar si ya se permitió la ubicación antes
    if (typeof window !== 'undefined') {
      const locationPermitted = localStorage.getItem('location-permitted')
      return locationPermitted !== 'true'
    }
    return false
  })
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const followingLoadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (feedTab !== 'following') return

    const loadFollowingFeed = async () => {
      setFollowingLoading(true)
      setFollowingPage(0)
      try {
        const res = await feedService.getFollowingPage(0, FEED_PAGE_SIZE)
        setFollowingPosts(res.posts)
        setFollowingHasMore(res.hasMore)
        setFollowingUseServerPagination(res.isPaginated)
        if (process.env.NODE_ENV === "development") {
          const authorIds = new Set(res.posts.map((p) => p.userId))
          console.debug(
            "[feed] following first page",
            { count: res.posts.length, authorCount: authorIds.size, isPaginated: res.isPaginated, hasMore: res.hasMore }
          )
        }
      } catch {
        setFollowingPosts([])
        setFollowingHasMore(false)
        setFollowingUseServerPagination(false)
        toast.error(te('No se pudo cargar el feed de seguidos', 'Could not load following feed'))
      } finally {
        setFollowingLoading(false)
      }
    }

    void loadFollowingFeed()
  }, [feedTab])

  useEffect(() => {
    if (feedTab !== "reshares") return
    setResharesLoading(true)
    void feedService.getResharesPage(0, FEED_PAGE_SIZE).then((res) => {
      setResharesPosts(res.posts)
      setResharesLoading(false)
    })
  }, [feedTab])

  useEffect(() => {
    if (!highlightPostId) {
      setPinnedHighlightPost(null)
      return
    }
    const inFeed =
      posts.some((p) => p.id === highlightPostId) ||
      followingPosts.some((p) => p.id === highlightPostId) ||
      localPosts.some((p) => p.id === highlightPostId) ||
      resharesPosts.some((p) => p.id === highlightPostId)
    if (inFeed) {
      setPinnedHighlightPost(null)
      return
    }
    void postService.getById(highlightPostId).then((p) => setPinnedHighlightPost(p))
  }, [highlightPostId, posts, followingPosts, localPosts, resharesPosts])

  const loadFollowingMore = useCallback(async () => {
    if (
      followingLoading ||
      followingLoadingMore ||
      !followingHasMore ||
      !followingUseServerPagination
    ) {
      return
    }
    try {
      setFollowingLoadingMore(true)
      const nextPage = followingPage + 1
      const res = await feedService.getFollowingPage(nextPage, FEED_PAGE_SIZE)
      setFollowingPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        const merged = [...prev]
        for (const p of res.posts) {
          if (!seen.has(p.id)) {
            seen.add(p.id)
            merged.push(p)
          }
        }
        return merged
      })
      setFollowingPage(nextPage)
      setFollowingHasMore(res.hasMore)
    } catch {
      setFollowingHasMore(false)
      toast.error(te('No se pudo cargar más publicaciones', 'Could not load more posts'))
    } finally {
      setFollowingLoadingMore(false)
    }
  }, [
    followingLoading,
    followingLoadingMore,
    followingHasMore,
    followingUseServerPagination,
    followingPage,
  ])

  useEffect(() => {
    const valid = new Set(posts.map((p) => p.id))
    setDeletedPostIds((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)))
      return next.size === prev.size && [...next].every((id) => prev.has(id)) ? prev : next
    })
  }, [posts])

  useEffect(() => {
    if (feedTab !== 'global' || !hasMore) return
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore()
        }
      },
      { rootMargin: '500px 0px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [feedTab, hasMore, loadMore])

  useEffect(() => {
    if (feedTab !== 'following' || !followingHasMore || !followingUseServerPagination) return
    const target = followingLoadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadFollowingMore()
        }
      },
      { rootMargin: '500px 0px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [feedTab, followingHasMore, followingUseServerPagination, loadFollowingMore])

  // Solicitar ubicación cuando se cambia al tab local
  useEffect(() => {
    if (feedTab === 'local' && user?.userId) {
      // Verificar si ya se permitió la ubicación
      const locationPermitted = localStorage.getItem('location-permitted')
      if (locationPermitted === 'true' && !locationEnabled) {
        // Ya se permitió antes, no mostrar banner
        setLocationError(false)
      } else if (locationPermitted !== 'true') {
        // No se ha permitido, mostrar banner
        checkLocationEndpoint()
      }
    }
  }, [feedTab, user?.userId, locationEnabled])

  const checkLocationEndpoint = async () => {
    setLocationError(true)
  }

  const requestLocation = async () => {
    if (isRequestingLocation) return
    setIsRequestingLocation(true)

    try {
      if (!navigator.geolocation) {
        toast.error('Tu navegador no soporta geolocalización')
        setLocationError(true)
        return
      }

      if (!window.isSecureContext) {
        toast.error('Geolocalización requiere HTTPS', {
          description: 'Accede a través de localhost o usa HTTPS',
          duration: 8000
        })
        setLocationError(true)
        return
      }

      const location = await locationService.getCurrentLocation()
      if (!location) {
        setLocationError(true)
        return
      }

      // Enviar ubicación al backend (ignorar errores del backend, la ubicación ya se obtuvo)
      try {
        await locationService.updateLocation(location)
      } catch {
        // El backend puede fallar pero la ubicación local ya funciona
      }

      localStorage.setItem('location-permitted', 'true')
      localStorage.setItem('sparkd_location', JSON.stringify(location))
      toast.success('¡Ubicación activada!')
      setLocationError(false)
      window.location.reload()
    } catch (error: any) {
      if (error.message?.includes('denegado') || error.message?.includes('denied') || error.message?.includes('PERMISSION_DENIED')) {
        toast.error('Permiso denegado', {
          description: 'Habilita los permisos de ubicación en tu navegador',
          duration: 5000
        })
      } else if (error.message?.includes('HTTPS') || error.message?.includes('secure')) {
        toast.error('Geolocalización requiere HTTPS', {
          description: 'Accede a través de http://localhost:3000',
          duration: 8000
        })
      } else {
        toast.error('No se pudo obtener la ubicación', {
          description: error.message || 'Intenta nuevamente',
          duration: 5000
        })
      }
      setLocationError(true)
    } finally {
      setIsRequestingLocation(false)
    }
  }

  // Scroll to top on mount
  useEffect(() => {
    if (!highlightPostId && !highlightCommentId) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [])

  useEffect(() => {
    if ((highlightPostId || highlightCommentId) && posts.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`post-${highlightPostId}`) || 
                       document.getElementById(`comment-${highlightCommentId}`)
        if (element) {
          // Solo hacer scroll si el elemento no está visible
          const rect = element.getBoundingClientRect()
          const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
          if (!isVisible) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }, 500)
    }
  }, [highlightPostId, highlightCommentId, posts])

  const handleDelete = (postId: string) => {
    setDeletedPostIds((prev) => new Set([...prev, postId]))
    setFollowingPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const filteredPosts = useMemo(() => {
    let list: Post[] = []
    if (feedTab === 'local') {
      list = Array.isArray(localPosts) ? localPosts : []
    } else if (feedTab === 'following') {
      list = Array.isArray(followingPosts) ? followingPosts : []
    } else if (feedTab === 'reshares') {
      list = Array.isArray(resharesPosts) ? resharesPosts : []
    } else {
      const baseGlobal = Array.isArray(posts) ? posts : []
      list = baseGlobal.filter((p) => !deletedPostIds.has(p.id))
    }
    let next = list

    if (filterType === 'withImage') {
      next = next.filter(post => post.file)
    } else if (filterType === 'withoutImage') {
      next = next.filter(post => !post.file)
    }

  /*   if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[feed page]', {
        feedTab,
        postsHookLen: posts.length,
        listaTrasTabYborrados: list.length,
        resultadoTrasBusquedaYfiltro: next.length,
        deletedPostIds: feedTab === 'global' ? [...deletedPostIds] : [],
        filterType,
      })
    } */

    return next
  }, [posts, localPosts, followingPosts, resharesPosts, feedTab, deletedPostIds, filterType])

  const displayPosts = useMemo(() => {
    if (!pinnedHighlightPost) return filteredPosts
    if (filteredPosts.some((p) => p.id === pinnedHighlightPost.id)) return filteredPosts
    return [pinnedHighlightPost, ...filteredPosts]
  }, [filteredPosts, pinnedHighlightPost])

  if (loading && posts.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        {[1, 2, 3].map((i) => (
          <SkeletonPost key={i} />
        ))}
      </div>
    )
  }

  const isLoadingFeed =
    (feedTab === 'local' && localLoading) ||
    (feedTab === 'global' && loading) ||
    (feedTab === 'following' && followingLoading) ||
    (feedTab === 'reshares' && resharesLoading)

  return (
    <div className="mx-auto max-w-2xl">
      <StoriesBar />

      {feedTab === "global" && user?.userId && (
        <FeedEngagementSummary className="mt-2" />
      )}
      {feedTab === "global" && <FeedRankingStrip mode="global" />}
      {feedTab === "local" && locationEnabled && (
        <FeedRankingStrip mode="local" radiusKm={localFeedRadius} />
      )}
      {feedTab === "following" && <FeedRankingStrip mode="following" />}

      {/* Banner de ubicación — solo cuando hay posts pero sin ubicación */}
      {feedTab === 'local' && locationError && localPosts.length > 0 && (
        <div className="mx-4 mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              {!window.isSecureContext ? (
                <>
                  <p className="text-sm font-medium text-foreground">{te('Geolocalización requiere HTTPS', 'Geolocation requires HTTPS')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {te('Accede a través de', 'Access via')} <code className="bg-muted px-1 py-0.5 rounded">http://localhost:3000</code> {te('para usar esta función', 'to use this feature')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">{te('Activa tu ubicación para ver posts cercanos', 'Enable your location to see nearby posts')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {te('Haz click en "Activar" y permite el acceso cuando tu navegador lo solicite', 'Click "Enable" and allow access when your browser asks')}
                  </p>
                </>
              )}
            </div>
            {window.isSecureContext && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  requestLocation()
                }}
                disabled={isRequestingLocation}
                className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 disabled:opacity-50 font-medium text-sm flex-shrink-0"
              >
                {isRequestingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  te('Activar', 'Enable')
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header with Tabs */}
      <div className="sticky top-16 z-20 border-b border-border/80 bg-background/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-2.5">
            <div className="flex flex-col gap-3 min-[600px]:flex-row min-[600px]:items-center min-[600px]:justify-between min-[600px]:gap-4">
              {features.personalizedFeed ? (
                <Tabs
                  value={feedTab}
                  onValueChange={(v) => setFeedTab(v as "global" | "local" | "following" | "reshares")}
                  className="w-full min-w-0 flex-row items-center gap-2 min-[600px]:flex-1"
                >
                  <TabsList className="grid h-11 w-full flex-1 grid-cols-4 gap-0.5 rounded-xl border border-border/60 bg-gradient-to-b from-muted/80 to-muted/50 p-1 shadow-inner sm:h-10">
                    <TabsTrigger
                      value="global"
                      className="flex items-center justify-center gap-1.5 rounded-lg px-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:gap-2 sm:px-2 sm:text-sm"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                      <span>{t("common.global")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="local"
                      className="flex items-center justify-center gap-1.5 rounded-lg px-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:gap-2 sm:px-2 sm:text-sm"
                    >
                      <Newspaper className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                      <span>{t("common.local")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="following"
                      className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:gap-2 sm:px-2 sm:text-sm"
                    >
                      <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                      <span className="truncate">{t("common.following")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="reshares"
                      className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:gap-2 sm:px-2 sm:text-sm"
                    >
                      <Repeat2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                      <span className="truncate">{te("Reposts", "Reposts")}</span>
                    </TabsTrigger>
                  </TabsList>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10 shrink-0 rounded-xl border border-border/70 bg-gradient-to-b from-card/90 to-muted/30 px-2.5 shadow-sm sm:h-9"
                        aria-label={te('Abrir opciones de vista, filtros y orden', 'Open view, filter, and sort options')}
                        title={te('Opciones del feed', 'Feed options')}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M4 6h16" />
                          <path d="M7 12h10" />
                          <path d="M10 18h4" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 border-border bg-card" sideOffset={6}>
                      <DropdownMenuLabel className="text-xs text-muted-foreground">{te('Vista', 'View')}</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => setViewMode("card")}
                        className={viewMode === "card" ? "bg-primary/10 text-primary" : ""}
                      >
                        <LayoutGrid className="h-4 w-4" aria-hidden />
                        {te('Tarjetas', 'Cards')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setViewMode("compact")}
                        className={viewMode === "compact" ? "bg-primary/10 text-primary" : ""}
                      >
                        <List className="h-4 w-4" aria-hidden />
                        {te('Compacta', 'Compact')}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">{te('Filtro', 'Filter')}</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => setFilterType("all")}
                        className={filterType === "all" ? "bg-primary/10 text-primary" : ""}
                      >
                        <Filter className="h-4 w-4" aria-hidden />
                        {te('Todos', 'All')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setFilterType("withImage")}
                        className={filterType === "withImage" ? "bg-primary/10 text-primary" : ""}
                      >
                        <ImageIcon className="h-4 w-4" aria-hidden />
                        {te('Con imagen', 'With image')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setFilterType("withoutImage")}
                        className={filterType === "withoutImage" ? "bg-primary/10 text-primary" : ""}
                      >
                        <ImageIcon className="h-4 w-4" aria-hidden />
                        {te('Sin imagen', 'Without image')}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">{te('Orden', 'Sort')}</DropdownMenuLabel>
                      {sortOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => changeSortMode(option.value)}
                          className={sortMode === option.value ? "bg-primary/10 text-primary" : ""}
                        >
                          <span className="text-base leading-none" aria-hidden>
                            {option.icon}
                          </span>
                          {te(option.labelEs, option.labelEn)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Tabs>
              ) : (
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Newspaper className="h-5 w-5" aria-hidden />
                  </span>
                  {te('Feed', 'Feed')}
                </h2>
              )}
            </div>
        </div>
      </div>

      {/* Posts */}
      {isLoadingFeed ? (
        <div className="p-4">
          {[1, 2, 3].map((i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      ) : displayPosts.length === 0 ? (
        feedTab === 'local' && locationError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
            <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-yellow-500" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold text-lg">{te('Activa tu ubicación', 'Enable your location')}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {te('Para ver posts de personas cercanas a ti necesitamos acceder a tu ubicación', 'To show nearby posts we need access to your location')}
              </p>
            </div>
            <button
              onClick={requestLocation}
              disabled={isRequestingLocation}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full transition-colors disabled:opacity-50"
            >
              {isRequestingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {isRequestingLocation ? te('Activando...', 'Enabling...') : te('Activar ubicación', 'Enable location')}
            </button>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              {te('Tu ubicación solo se usa para mostrarte contenido cercano y nunca se comparte públicamente', 'Your location is only used to show nearby content and is never shared publicly')}
            </p>
          </div>
        ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
          <Newspaper className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            {te('No hay posts aun', 'No posts yet')}
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {feedTab === 'following' 
              ? te('Sigue a más personas para ver su contenido', 'Follow more people to see their content')
              : feedTab === 'local'
              ? te('No hay posts en tu zona aún', 'No posts in your area yet')
              : feedTab === 'reshares'
              ? te('No hay reposts en tu red aún', 'No reposts in your network yet')
              : te('Se el primero en publicar algo!', 'Be the first to post something!')}
          </p>
          <ActivityCoreStreamStrip
            te={te}
            context="feed"
            mode={experienceMode as ActivityCoreExperienceMode}
            lat={pulseCoords?.lat}
            lng={pulseCoords?.lng}
            className="w-full max-w-md"
          />
        </div>
        )
      ) : (
        <div className="p-4">
          {displayPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onUpdate={feedTab === 'local' ? handleLocalRefreshAndScroll : handleRefreshAndScroll}
              highlight={post.id === highlightPostId}
              compact={viewMode === 'compact'}
            />
          ))}
          {feedTab === 'global' && hasMore && (
            <div ref={loadMoreRef} className="py-6 flex justify-center">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {te('Cargando más posts...', 'Loading more posts...')}
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => void loadMore()}>
                  {te('Cargar más', 'Load more')}
                </Button>
              )}
            </div>
          )}
          {feedTab === 'following' &&
            followingHasMore &&
            followingUseServerPagination &&
            displayPosts.length > 0 && (
              <div ref={followingLoadMoreRef} className="py-6 flex justify-center">
                {followingLoadingMore ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {te('Cargando más posts...', 'Loading more posts...')}
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => void loadFollowingMore()}>
                    {te('Cargar más', 'Load more')}
                  </Button>
                )}
              </div>
            )}
        </div>
      )}

      <CreatePostDialog onCreated={onRefresh} />
    </div>
  )
}
