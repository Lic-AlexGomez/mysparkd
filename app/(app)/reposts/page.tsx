"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Repeat2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { repostService, type RepostItem } from "@/lib/services/repost"
import { PostCard } from "@/components/feed/post-card"
import { postService } from "@/lib/services/post"
import { useI18n } from "@/lib/i18n"
import type { Post } from "@/lib/types"

export default function MyRepostsPage() {
  const { te } = useI18n()
  const router = useRouter()
  const [items, setItems] = useState<RepostItem[]>([])
  const [postsById, setPostsById] = useState<Record<string, Post>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const { items: rows } = await repostService.getMyReposts(0, 30)
      setItems(rows)
      const posts: Record<string, Post> = {}
      await Promise.all(
        rows.map(async (r) => {
          const post = await postService.getById(r.postId)
          if (post) posts[r.postId] = post
        })
      )
      setPostsById(posts)
      setLoading(false)
    })()
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Repeat2 className="h-5 w-5 text-primary" />
            {te("Mis reposts", "My reposts")}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          {te("No has reposteado nada aún", "You haven't reposted anything yet")}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const post = postsById[item.postId]
            if (!post) return null
            return (
              <div key={item.repostId}>
                {item.comment && (
                  <p className="mb-2 text-sm text-muted-foreground px-1">{item.comment}</p>
                )}
                <PostCard post={post} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
