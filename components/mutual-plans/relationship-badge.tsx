"use client"

import { Heart, Sparkles, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MutualRelationshipType } from "@/lib/types/mutual-plans"
import { useI18n } from "@/lib/i18n"

export function RelationshipBadge({
  type,
  className,
  compact,
}: {
  type: MutualRelationshipType
  className?: string
  compact?: boolean
}) {
  const { t } = useI18n()
  const raw = String(type).toLowerCase()
  const isMatch = raw === "match"
  const isFriend = raw === "friend"
  const Icon = isMatch ? Heart : isFriend ? Users : Sparkles
  const label = isMatch
    ? t("mutualPlans.relationship.match")
    : isFriend
      ? t("mutualPlans.relationship.friend")
      : t("mutualPlans.relationship.interest")

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide",
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        isMatch && "border-pink-500/40 bg-pink-500/10 text-pink-600 dark:text-pink-400",
        isFriend && "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
        !isMatch && !isFriend && "border-primary/40 bg-primary/10 text-primary",
        className
      )}
    >
      <Icon className={cn("shrink-0", compact ? "size-2.5" : "size-3")} aria-hidden />
      {label}
    </span>
  )
}
