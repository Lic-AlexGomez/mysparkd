"use client"

import { Heart, MessageCircle, Repeat2, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { Post } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EngagementStatsProps {
  posts: Post[]
  className?: string
}

export function EngagementStats({ posts, className }: EngagementStatsProps) {
  const { user } = useAuth()
  
  const myPosts = posts.filter(post => post.userId === user?.userId)
  const sourcePosts = myPosts.length > 0 ? myPosts : posts
  const isMyScope = myPosts.length > 0
  
  const totalLikes = sourcePosts.reduce((sum, post) => sum + (post.likeCount || 0), 0)
  const totalComments = sourcePosts.reduce((sum, post) => sum + (post.commentsCount || 0), 0)
  const totalReposts = sourcePosts.reduce((sum, post) => sum + (post.repostCount || 0), 0)
  const avgEngagement = sourcePosts.length > 0
    ? Math.round((totalLikes + totalComments + totalReposts) / sourcePosts.length)
    : 0

  return (
    <div
      className={cn(
        "flex justify-around rounded-xl border border-border bg-card/60 py-3 mx-4 mb-4 mt-4",
        className
      )}
      title={isMyScope ? "Resumen de mis publicaciones en este lote" : "Resumen del feed cargado"}
    >
      <div className="flex items-center gap-1.5">
        <Heart className="h-3.5 w-3.5 text-secondary" />
        <span className="text-xs font-semibold text-foreground">{totalLikes}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <MessageCircle className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">{totalComments}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Repeat2 className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">{totalReposts}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">{avgEngagement}</span>
      </div>
    </div>
  )
}
