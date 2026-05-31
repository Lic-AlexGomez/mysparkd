"use client"

import { useEffect, useState } from "react"
import { Heart, MessageCircle, Repeat2, TrendingUp, Loader2 } from "lucide-react"
import { feedService, type EngagementSummary } from "@/lib/services/feed"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

interface FeedEngagementSummaryProps {
  /** Client-side fallback from loaded posts */
  fallback?: {
    totalLikes: number
    totalComments: number
    totalReposts: number
    avgEngagement: number
  }
  className?: string
}

export function FeedEngagementSummary({ fallback, className }: FeedEngagementSummaryProps) {
  const { te } = useI18n()
  const [summary, setSummary] = useState<EngagementSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void feedService.getEngagementSummary().then((data) => {
      if (!cancelled) {
        setSummary(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const totalLikes = summary?.totalLikes ?? fallback?.totalLikes ?? 0
  const totalComments = summary?.totalComments ?? fallback?.totalComments ?? 0
  const totalReposts = summary?.totalReposts ?? fallback?.totalReposts ?? 0
  const avgEngagement =
    summary?.avgEngagementPerPost ??
    (summary?.engagementRate != null
      ? Math.round(summary.engagementRate * 100) / 100
      : fallback?.avgEngagement ?? 0)

  if (loading && !fallback) {
    return (
      <div className={cn("flex justify-center py-3", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!summary && !fallback) return null

  return (
    <div
      className={cn(
        "flex justify-around rounded-xl border border-border bg-card/60 py-3 mx-4 mb-4 mt-4",
        className
      )}
      title={te("Resumen de engagement", "Engagement summary")}
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
