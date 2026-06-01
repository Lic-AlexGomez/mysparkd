"use client"

import Link from "next/link"
import { CalendarDays, MapPin, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { MutualSharedPlanNearYou } from "@/lib/types/mutual-plans"

export function MutualSharedPlanCard({
  plan,
  t,
}: {
  plan: MutualSharedPlanNearYou
  t: (key: string) => string
}) {
  return (
    <Link
      href={`/events/${plan.eventId}`}
      className="flex flex-col gap-3 rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/5 via-card to-primary/5 p-4 shadow-md transition-transform hover:scale-[1.01] hover:border-secondary/50 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold leading-snug">{plan.title}</h3>
        {plan.connectionCount != null ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
            <Users className="size-3.5" aria-hidden />
            {plan.connectionCount}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {plan.startsAt ? (
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <CalendarDays className="size-3.5 text-primary" aria-hidden />
            {new Date(plan.startsAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ) : null}
        {plan.distanceKm != null ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {plan.distanceKm.toFixed(1)} km
          </span>
        ) : null}
      </div>
      {plan.topConnections && plan.topConnections.length > 0 ? (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {plan.topConnections.slice(0, 4).map((c) => (
              <Avatar key={c.userId} className="size-8 border-2 border-background ring-1 ring-border">
                <AvatarImage src={c.profilePictureUrl ?? undefined} alt="" />
                <AvatarFallback className="text-[10px]">
                  {c.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{t("mutualPlans.sharedPlanFaces")}</span>
        </div>
      ) : null}
    </Link>
  )
}
