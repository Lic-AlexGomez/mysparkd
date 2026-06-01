"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Trophy } from "lucide-react"
import { feedService, type RankingEntry } from "@/lib/services/feed"
import { profileHref } from "@/lib/profile-route"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"

type Props = {
  mode: "global" | "local" | "following"
  radiusKm?: number
}

export function FeedRankingStrip({ mode, radiusKm = 50 }: Props) {
  const { user } = useAuth()
  const { te } = useI18n()
  const [rows, setRows] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      const data =
        mode === "local"
          ? await feedService.getLocalRanking(radiusKm)
          : mode === "following"
            ? await feedService.getFollowingRanking()
            : await feedService.getGlobalRanking()
      if (!cancelled) {
        setRows(data.slice(0, 8))
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode, radiusKm])

  if (loading) {
    return (
      <div className="mx-3 mb-3 flex items-center justify-center rounded-xl border border-border/60 bg-card/50 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (rows.length === 0) return null

  return (
    <section className="mx-3 mb-3 rounded-xl border border-border/60 bg-gradient-to-r from-primary/[0.06] to-secondary/[0.06] p-3">
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {mode === "local"
            ? te("Ranking local", "Local ranking")
            : mode === "following"
              ? te("Ranking de seguidos", "Following ranking")
              : te("Ranking global", "Global ranking")}
        </h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {rows.map((entry) => (
          <Link
            key={entry.userId}
            href={profileHref(entry.userId, user?.userId)}
            className="flex min-w-[72px] flex-col items-center gap-1 rounded-lg p-1.5 hover:bg-muted/50"
          >
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarImage src={entry.profilePictureUrl} />
              <AvatarFallback className="text-xs">
                {entry.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[68px] truncate text-[10px] font-medium">
              {entry.username || entry.userId.slice(0, 6)}
            </span>
            {entry.score != null && (
              <span className="text-[10px] text-primary font-bold">{Math.round(entry.score)}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
