"use client"

import { useRouter } from "next/navigation"
import type { DateCard } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Calendar, Clock, Heart, MapPin, Zap } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "🍽️ Comida",
  ACTIVITY: "🎯 Actividad",
  EVENT: "🎉 Evento",
  CHILL: "😌 Chill",
  ADVENTURE: "🏔️ Aventura",
  OPEN_SUGGESTION: "💡 Abierto",
}
const PLAN_LABELS: Record<string, string> = {
  CAFE: "☕ Café",
  RESTAURANT: "🍴 Restaurante",
  BAR: "🍸 Bar",
  PARK: "🌳 Parque",
  BEACH: "🏖️ Playa",
  MALL: "🛍️ Mall",
  CINEMA: "🎬 Cine",
  OTHER: "📍 Otro",
  OPEN_SUGGESTION: "💡 Sugerencia",
}

export type FastDateOfferCardProps = {
  card: DateCard
  currentUserId?: string | null
  onInterest: () => void
  className?: string
  fastDateLabel: string
  interestLabel: string
  expiresLabel: string
}

export function FastDateOfferCard({
  card,
  currentUserId,
  onInterest,
  className,
  fastDateLabel,
  interestLabel,
  expiresLabel,
}: FastDateOfferCardProps) {
  const router = useRouter()
  const isOwn = card.userId === currentUserId

  return (
    <Card
      className={cn(
        "overflow-hidden border-border shadow-sm transition-colors hover:border-secondary/50 hover:shadow-md",
        "border-l-[5px] border-l-secondary bg-gradient-to-br from-card to-secondary/[0.06] ring-1 ring-secondary/15",
        className
      )}
    >
      <CardContent className="p-4 pt-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="gap-1 border-0 bg-secondary/20 text-secondary-foreground">
            <Zap className="size-3" aria-hidden />
            {fastDateLabel}
          </Badge>
        </div>
        <div className="flex items-start gap-3">
          <Avatar
            className="h-10 w-10 shrink-0 cursor-pointer border-2 border-secondary/30"
            onClick={() => router.push(`/profile/${card.userId}`)}
          >
            <AvatarImage src={card.mainPhotoUrl} />
            <AvatarFallback className="bg-secondary/15 text-secondary text-sm">
              {card.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/profile/${card.userId}`)}
                className="text-sm font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                @{card.username}
              </button>
              <Badge className="border-0 bg-secondary/15 px-2 py-0 text-[10px] text-secondary">
                {CATEGORY_LABELS[card.category] || card.category}
              </Badge>
              {(card as { compatibility?: number }).compatibility != null &&
                (card as { compatibility?: number }).compatibility! > 0 && (
                  <Badge className="border-0 bg-primary/10 px-2 py-0 text-[10px] text-primary">
                    {(card as { compatibility?: number }).compatibility}% match
                  </Badge>
                )}
            </div>
            <h3 className="mt-1 text-sm font-bold">{card.title}</h3>
            {card.message && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{card.message}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                {format(new Date(card.dateTime), "d MMM, HH:mm", { locale: es })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {card.locationZone}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                {expiresLabel}{" "}
                {formatDistanceToNow(new Date(card.expiresAt), { addSuffix: true, locale: es })}
              </span>
            </div>
            {card.plans && card.plans.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {card.plans.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {PLAN_LABELS[p] || p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {!isOwn && (
          <Button
            size="sm"
            className="mt-3 w-full bg-gradient-to-r from-primary to-secondary font-bold text-black"
            onClick={onInterest}
          >
            <Heart className="mr-1 h-4 w-4" />
            {interestLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
