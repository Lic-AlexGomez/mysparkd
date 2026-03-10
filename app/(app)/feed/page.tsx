"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useFeed } from "@/hooks/use-feed"
import { PostCard } from "@/components/feed/post-card"
import { CreatePostDialog } from "@/components/feed/create-post-dialog"
import { EngagementStats } from "@/components/feed/engagement-stats"
import { StoriesBar } from "@/components/feed/stories-bar"
import { Loader2, Newspaper, Sliders, Sparkles, Users } from "lucide-react"
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

  // Filtrar posts según el tab activo
  const displayPosts = localPosts.length > 0 ? localPosts : posts
  const filteredPosts = feedTab === 'following' 
    ? displayPosts // TODO: Filtrar solo posts de seguidos cuando el backend lo soporte
    : displayPosts

  if (loading && posts.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <div className="flex items-center justify-between px-4 py-2">
          {features.personalizedFeed ? (
          <Tabs value={feedTab} onValueChange={(v) => setFeedTab(v as any)} className="flex-1">
            <TabsList className="w-full grid grid-cols-3 max-w-md">
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 ml-2">
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

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Newspaper className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No hay posts aun</p>
          <p className="text-sm text-muted-foreground">
            {feedTab === 'following' 
              ? 'Sigue a más personas para ver su contenido' 
              : 'Se el primero en publicar algo!'}
          </p>
        </div>
      ) : (
        <div className="p-4">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onUpdate={onRefresh}
              highlight={post.id === highlightPostId}
            />
          ))}
        </div>
      )}

      <CreatePostDialog onCreated={onRefresh} />
    </div>
  )
}
