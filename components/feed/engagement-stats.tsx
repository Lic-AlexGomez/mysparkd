"use client"

import { Heart, MessageCircle, Repeat2, TrendingUp } from "lucide-react"
import type { Post } from "@/lib/types"

interface EngagementStatsProps {
  posts: Post[]
}

export function EngagementStats({ posts }: EngagementStatsProps) {
  const totalLikes = posts.reduce((sum, post) => sum + (post.likeCount || 0), 0)
  const totalComments = posts.reduce((sum, post) => sum + (post.commentsCount || 0), 0)
  const totalReposts = posts.reduce((sum, post) => sum + (post.repostCount || 0), 0)
  const avgEngagement = posts.length > 0 ? Math.round((totalLikes + totalComments + totalReposts) / posts.length) : 0

  return (
    <div className="flex justify-around bg-card/60 mx-4 mb-4 py-3 rounded-xl border border-border">
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
