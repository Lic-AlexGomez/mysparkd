"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useFeed } from "@/hooks/use-feed"
import { PostCard } from "@/components/feed/post-card"
import { CreatePostDialog } from "@/components/feed/create-post-dialog"
import { EngagementStats } from "@/components/feed/engagement-stats"
import { StoriesBar } from "@/components/feed/stories-bar"
import { SkeletonPost } from "@/components/ui/skeleton-post"
import { Loader2, Newspaper, Sliders, Sparkles, Users, Search, X, Filter, Image as ImageIcon, Calendar, LayoutGrid, List } from "lucide-react"
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
  const { posts, sortMode, loading, onRefresh, changeSortMode } = useFeed()
  const [localPosts, setLocalPosts] = useState(posts)
  const [feedTab, setFeedTab] = useState<'global' | 'local' | 'following'>('global')
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'withImage' | 'withoutImage'>('all')
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card')

  useEffect(() => {
    setLocalPosts(posts)
  }, [posts])

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
    setLocalPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  // Filtrar posts según búsqueda y filtros
  const displayPosts = localPosts.length > 0 ? localPosts : posts
  
  // Filtrar por pestaña
  let filteredPosts = displayPosts
  
  if (feedTab === 'following') {
    // Mostrar solo posts de usuarios que sigues
    // TODO: Implementar lógica de seguimiento cuando el backend esté listo
    // Por ahora, mostrar posts del usuario actual como ejemplo
    filteredPosts = displayPosts.filter(post => post.userId === user?.userId)
  } else if (feedTab === 'local') {
    // Mostrar posts de usuarios cercanos
    // TODO: Implementar geolocalización cuando el backend esté listo
    // Por ahora, mostrar todos los posts
    filteredPosts = displayPosts
  } else {
    // Global: mostrar todos los posts
    filteredPosts = displayPosts
  }
  
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

  return (
    <div className="mx-auto max-w-2xl">
      {/* Stats */}
      {posts.length > 0 && <EngagementStats posts={posts} />}

      {/* Stories */}
      <StoriesBar />

      {/* Header with Tabs */}
      <div className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 px-4 py-2">
          {features.personalizedFeed ? (
          <Tabs value={feedTab} onValueChange={(v) => setFeedTab(v as any)} className="flex-1 md:max-w-md">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="global" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
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
      {filteredPosts.length === 0 ? (
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
              onUpdate={onRefresh}
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
