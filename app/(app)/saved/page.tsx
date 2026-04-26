"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { bookmarkService } from "@/lib/services/bookmark"
import { PostCard } from "@/components/feed/post-card"
import { Bookmark, Loader2 } from "lucide-react"
import type { Post } from "@/lib/types"

export default function SavedPostsPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSavedPosts = async () => {
      if (!user?.userId) {
        setPosts([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const page = await bookmarkService.getSavedPosts(0, 50)
        setPosts(page.content)
      } catch {
        setPosts([])
        setError("No se pudieron cargar tus guardados")
      } finally {
        setLoading(false)
      }
    }

    loadSavedPosts()
  }, [user])

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-16 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-bold text-foreground">Posts Guardados</h1>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Bookmark className="h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground">No tienes posts guardados</p>
        </div>
      ) : (
        <div className="p-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
