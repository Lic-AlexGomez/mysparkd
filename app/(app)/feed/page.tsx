"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import type { Post } from "@/lib/types"
import { PostCard } from "@/components/feed/post-card"
import { CreatePostDialog } from "@/components/feed/create-post-dialog"
import { Loader2, Newspaper } from "lucide-react"

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api.get<Post[]>("/api/posts/feed")
      setPosts(data)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="sticky top-16 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-bold text-foreground">Feed</h1>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Newspaper className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No hay posts aun</p>
          <p className="text-sm text-muted-foreground">
            Se el primero en publicar algo!
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onUpdate={fetchPosts}
            />
          ))}
        </div>
      )}

      <CreatePostDialog onCreated={fetchPosts} />
    </div>
  )
}
