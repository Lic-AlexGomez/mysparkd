"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useFeed } from "@/hooks/use-feed"
import { useLocalFeed } from "@/hooks/use-local-feed"
import { locationService } from "@/lib/services/location"
import { PostCard } from "@/components/feed/post-card"
import { CreatePostDialog } from "@/components/feed/create-post-dialog"
import { EngagementStats } from "@/components/feed/engagement-stats"
import { StoriesBar } from "@/components/feed/stories-bar"
import { SkeletonPost } from "@/components/ui/skeleton-post"
import { Loader2, Newspaper, Sliders, Sparkles, Users, Search, X, Filter, Image as ImageIcon, Calendar, LayoutGrid, List, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const sortOptions = [
  { value: 'chronological' as const, label: 'Cronológico', icon: '🕐' },
  { value: 'relevant' as const, label: 'Relevante', icon: '⚡' },
  { value: 'compatible' as const, label: 'Compatible', icon: '💫' },
  { value: 'top' as const, label: 'Populares', icon: '🔥' },
]

export default function FeedPage() {
  const { user } = useAuth()
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
  
  const { posts, sortMode, loading, loadingMore, hasMore, onRefresh, changeSortMode, loadMore } = useFeed()
  const { posts: localPosts, loading: localLoading, locationEnabled, refresh: refreshLocalFeed } = useLocalFeed(localFeedRadius)
  const [displayLocalPosts, setDisplayLocalPosts] = useState(posts)
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
  const [feedTab, setFeedTab] = useState<'global' | 'local' | 'following'>('global')
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'withImage' | 'withoutImage'>('all')
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card')
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

  useEffect(() => {
    setDisplayLocalPosts(posts)
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
    setDisplayLocalPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const filteredPosts = useMemo(() => {
    let basePosts = posts

    if (feedTab === 'local') {
      basePosts = Array.isArray(localPosts) ? localPosts : []
    } else if (feedTab === 'following') {
      // Mostrar solo posts de usuarios que sigues
      // TODO: Implementar lógica de seguimiento cuando el backend esté listo
      basePosts = Array.isArray(posts) ? posts.filter(post => post.userId === user?.userId) : []
    } else {
      basePosts = Array.isArray(posts) ? posts : []
    }

    const displayPosts = displayLocalPosts.length > 0 && feedTab === 'global' ? displayLocalPosts : basePosts
    let next = Array.isArray(displayPosts) ? displayPosts : []

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      next = next.filter(post =>
        (post.body || "").toLowerCase().includes(q) ||
        post.username.toLowerCase().includes(q)
      )
    }

    if (filterType === 'withImage') {
      next = next.filter(post => post.file)
    } else if (filterType === 'withoutImage') {
      next = next.filter(post => !post.file)
    }

    return next
  }, [posts, localPosts, user?.userId, feedTab, displayLocalPosts, searchQuery, filterType])

  if (loading && posts.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        {[1, 2, 3].map((i) => (
          <SkeletonPost key={i} />
        ))}
      </div>
    )
  }

  const isLoadingFeed = (feedTab === 'local' && localLoading) || (feedTab === 'global' && loading)

  return (
    <div className="mx-auto max-w-2xl">
      {/* Stats */}
      {posts.length > 0 && <EngagementStats posts={posts} />}

      {/* Stories */}
      <StoriesBar />

      {/* Banner de ubicación — solo cuando hay posts pero sin ubicación */}
      {feedTab === 'local' && locationError && localPosts.length > 0 && (
        <div className="mx-4 mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              {!window.isSecureContext ? (
                <>
                  <p className="text-sm font-medium text-foreground">Geolocalización requiere HTTPS</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accede a través de <code className="bg-muted px-1 py-0.5 rounded">http://localhost:3000</code> para usar esta función
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">Activa tu ubicación para ver posts cercanos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Haz click en "Activar" y permite el acceso cuando tu navegador lo solicite
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
                  'Activar'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header with Tabs */}
      <div className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 px-4 py-2">
          {features.personalizedFeed ? (
          <Tabs value={feedTab} onValueChange={(v) => setFeedTab(v as any)} className="flex-1 md:max-w-md">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="global" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-sparkle" />
                Global
              </TabsTrigger>
              <TabsTrigger value="local" className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                Local
              </TabsTrigger>
              <TabsTrigger value="following" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Siguiendo
              </TabsTrigger>
            </TabsList>
          </Tabs>
          ) : (
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Feed
            </h2>
          )}
          
          <div className="flex gap-2 flex-shrink-0 justify-end md:justify-start">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSearch(!showSearch)}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'card' ? 'compact' : 'card')}
              title={viewMode === 'card' ? 'Vista compacta' : 'Vista tarjetas'}
            >
              {viewMode === 'card' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={() => setFilterType('all')} className={filterType === 'all' ? 'bg-primary/10' : ''}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('withImage')} className={filterType === 'withImage' ? 'bg-primary/10' : ''}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Con imagen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('withoutImage')} className={filterType === 'withoutImage' ? 'bg-primary/10' : ''}>
                  Sin imagen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Sliders className="h-4 w-4" />
                  <span className="text-lg">{sortOptions.find(o => o.value === sortMode)?.icon}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => changeSortMode(option.value)}
                    className={sortMode === option.value ? 'bg-primary/10 text-primary' : ''}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Barra de búsqueda */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      {isLoadingFeed ? (
        <div className="p-4">
          {[1, 2, 3].map((i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        feedTab === 'local' && locationError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
            <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-yellow-500" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold text-lg">Activa tu ubicación</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Para ver posts de personas cercanas a ti necesitamos acceder a tu ubicación
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
              {isRequestingLocation ? 'Activando...' : 'Activar ubicación'}
            </button>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Tu ubicación solo se usa para mostrarte contenido cercano y nunca se comparte públicamente
            </p>
          </div>
        ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Newspaper className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No se encontraron posts' : 'No hay posts aun'}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery 
              ? 'Intenta con otra búsqueda'
              : feedTab === 'following' 
              ? 'Sigue a más personas para ver su contenido' 
              : feedTab === 'local'
              ? 'No hay posts en tu zona aún'
              : 'Se el primero en publicar algo!'}
          </p>
          {searchQuery && (
            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
              Limpiar búsqueda
            </Button>
          )}
        </div>
        )
      ) : (
        <div className="p-4">
          {searchQuery && (
            <p className="text-sm text-muted-foreground mb-4">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'resultado' : 'resultados'}
            </p>
          )}
          {filteredPosts.map((post) => (
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
                  Cargando más posts...
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => void loadMore()}>
                  Cargar más
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
