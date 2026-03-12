"use client"

import { useState, useEffect } from "react"
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
  
  const { posts, sortMode, loading, onRefresh, changeSortMode } = useFeed()
  const { posts: localPosts, loading: localLoading, locationEnabled, refresh: refreshLocalFeed } = useLocalFeed(localFeedRadius)
  const [displayLocalPosts, setDisplayLocalPosts] = useState(posts)
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

  useEffect(() => {
    setDisplayLocalPosts(posts)
  }, [posts])

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
    // Por ahora, mostrar que la funcionalidad no está disponible
    setLocationError(true)
  }

  const requestLocation = async () => {
    if (isRequestingLocation) return
    
    setIsRequestingLocation(true)
    setLocationError(false)
    
    try {
      if (!navigator.geolocation) {
        toast.error('Tu navegador no soporta geolocalización')
        setLocationError(true)
        setIsRequestingLocation(false)
        return
      }

      // Verificar si estamos en un contexto seguro (HTTPS o localhost)
      if (!window.isSecureContext) {
        toast.error('Geolocalización requiere HTTPS', {
          description: 'Accede a través de localhost o usa HTTPS',
          duration: 8000
        })
        setLocationError(true)
        setIsRequestingLocation(false)
        return
      }

      const result = await locationService.requestAndUpdateLocation()
      
      if (result) {
        // Guardar que se permitió la ubicación
        localStorage.setItem('location-permitted', 'true')
        toast.success('¡Ubicación activada!')
        setLocationError(false)
        window.location.reload()
      } else {
        setLocationError(true)
      }
    } catch (error: any) {
      console.error('Error requesting location:', error)
      
      // Verificar si es error 404 (endpoint no existe)
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        toast.error('Funcionalidad no disponible', {
          description: 'El feed local estará disponible próximamente',
          duration: 5000
        })
      } else if (error.message?.includes('HTTPS') || error.message?.includes('secure')) {
        toast.error('Geolocalización requiere HTTPS', {
          description: 'Accede a través de http://localhost:3000',
          duration: 8000
        })
      } else if (error.message?.includes('denegado') || error.message?.includes('denied')) {
        toast.error('Permiso denegado', {
          description: 'Habilita los permisos de ubicación en tu navegador',
          duration: 5000
        })
      } else {
        toast.error('Funcionalidad no disponible', {
          description: 'El feed local estará disponible próximamente',
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

  // Filtrar posts según búsqueda y filtros
  let basePosts = posts
  
  // Seleccionar posts según la pestaña
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
  
  // Asegurar que displayPosts sea siempre un array
  const safePosts = Array.isArray(displayPosts) ? displayPosts : []
  
  // Filtrar por pestaña
  let filteredPosts = safePosts
  
  // Búsqueda
  if (searchQuery) {
    filteredPosts = filteredPosts.filter(post => 
      post.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
  
  // Filtro por tipo
  if (filterType === 'withImage') {
    filteredPosts = filteredPosts.filter(post => post.file)
  } else if (filterType === 'withoutImage') {
    filteredPosts = filteredPosts.filter(post => !post.file)
  }

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

      {/* Banner de ubicación para feed local */}
      {feedTab === 'local' && locationError && (
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
              : 'Se el primero en publicar algo!'}
          </p>
          {searchQuery && (
            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
              Limpiar búsqueda
            </Button>
          )}
        </div>
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
              onUpdate={feedTab === 'local' ? refreshLocalFeed : onRefresh}
              highlight={post.id === highlightPostId}
              compact={viewMode === 'compact'}
            />
          ))}
        </div>
      )}

      <CreatePostDialog onCreated={onRefresh} />
    </div>
  )
}
