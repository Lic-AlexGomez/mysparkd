"use client"

import Link from "next/link"
import { Loader2, Users } from "lucide-react"
import { useMutualPlansEvent } from "@/hooks/use-mutual-plans"
import { useI18n } from "@/lib/i18n"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RelationshipBadge } from "@/components/mutual-plans/relationship-badge"
import { cn } from "@/lib/utils"

/** Compact block on event detail — “you’re not going alone” */
export function EventMutualPlansInline({ eventId }: { eventId: string }) {
  const { t } = useI18n()
  const features = useFeatureFlags()
  const { data, loading, total } = useMutualPlansEvent(features.mutualPlansPage ? eventId : "", 120_000)

  if (!features.mutualPlansPage) return null
  if (!eventId) return null
  if (loading && total === 0) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t("mutualPlans.eventLoading")}
      </div>
    )
  }
  if (!data || total === 0) return null

  const merged = [
    ...data.goingWithYou.map((r) => ({ ...r, _section: "going" as const })),
    ...data.matchesHere.map((r) => ({ ...r, _section: "match" as const })),
    ...data.friendsInterested.map((r) => ({ ...r, _section: "friend" as const })),
  ]
  const uniqueByUser = merged.filter(
    (row, i, arr) => arr.findIndex((x) => x.userId === row.userId) === i
  )

  return (
    <div className="mx-auto max-w-5xl px-4 pb-4">
      <div
        className={cn(
          "rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/[0.07] via-card to-secondary/[0.07] p-4 shadow-sm ring-1 ring-primary/10"
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" aria-hidden />
            <div>
              <p className="font-bold text-foreground">{t("mutualPlans.eventInlineTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("mutualPlans.eventInlineSubtitle")}</p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-primary/40">
            <Link href="/mutual-plans">{t("mutualPlans.seeAllPlans")}</Link>
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {uniqueByUser.slice(0, 8).map((row) => (
            <Link
              key={row.userId}
              href={`/profile/${row.userId}`}
              className="group flex flex-col items-center gap-1"
            >
              <Avatar className="size-12 ring-2 ring-transparent transition-all group-hover:ring-primary/40">
                <AvatarImage src={row.profilePictureUrl ?? undefined} alt="" />
                <AvatarFallback>{row.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <RelationshipBadge type={row.relationshipType} compact />
              <span className="max-w-[4.5rem] truncate text-center text-[10px] text-muted-foreground">
                @{row.username}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
