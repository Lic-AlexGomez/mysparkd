"use client"

import Link from "next/link"
import { MapPin, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RelationshipBadge } from "@/components/mutual-plans/relationship-badge"
import type { MutualPlanConnection } from "@/lib/types/mutual-plans"
import { cn } from "@/lib/utils"

export function MutualConnectionRow({
  row,
  showEvent,
  t,
}: {
  row: MutualPlanConnection
  showEvent?: boolean
  t: (key: string) => string
}) {
  const name = row.displayName || row.username
  const initials = name.replace(/^@/, "").trim().slice(0, 2).toUpperCase() || "?"

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05] sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Link href={`/profile/${row.userId}`} className="shrink-0">
          <Avatar className="size-12 ring-2 ring-primary/20">
            <AvatarImage src={row.profilePictureUrl ?? undefined} alt="" />
            <AvatarFallback className="text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/profile/${row.userId}`} className="truncate font-semibold hover:underline">
              {name}
            </Link>
            <RelationshipBadge type={row.relationshipType} compact />
            {row.confidenceScore != null ? (
              <span className="text-[10px] font-medium text-muted-foreground">
                {t("mutualPlans.confidence")} {Math.round(row.confidenceScore)}%
              </span>
            ) : null}
          </div>
          {showEvent !== false && row.eventTitle ? (
            <Link
              href={`/events/${row.eventId}`}
              className="mt-1 line-clamp-2 text-sm font-medium text-primary hover:underline"
            >
              {row.eventTitle}
            </Link>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {row.startsAt ? (
              <span>
                {new Date(row.startsAt).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : null}
            {row.distanceKm != null ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3 shrink-0" aria-hidden />
                {row.distanceKm.toFixed(1)} km
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <Button asChild size="sm" variant="secondary" className="shrink-0 gap-1.5">
        <Link href="/chat">
          <MessageCircle className="size-4" aria-hidden />
          {t("mutualPlans.sayHi")}
        </Link>
      </Button>
    </div>
  )
}
