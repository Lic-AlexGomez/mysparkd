"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { activityFeedService, type UnifiedFeedItem, type ActivityFeedFilter, type FeedItemType } from "@/lib/services/activity-feed"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, MapPin, Users, Zap, Heart, Star } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"
import { useI18n } from "@/lib/i18n"

const TYPE_FILTERS: { label: string; value: FeedItemType | undefined }[] = [
  { label: "Todo", value: undefined },
  { label: "Citas", value: "DATE" },
  { label: "Meetups", value: "MEETUP" },
]

function ActivityCard({ item, onClick }: { item: UnifiedFeedItem; onClick: () => void }) {
  const isDate = item.type === "DATE"
  const isMeetup = item.type === "MEETUP"

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all overflow-hidden"
    >
      {/* Cover — solo meetups (events) */}
      {isMeetup && item.coverPhotoUrl && (
        <div className="h-36 w-full overflow-hidden">
          <img src={item.coverPhotoUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-[10px] px-2 py-0.5 ${isDate ? "bg-secondary/15 text-secondary border-secondary/30" : "bg-primary/15 text-primary border-primary/30"}`}
              >
                {isDate ? "💫 Cita" : "🎉 Meetup"}
              </Badge>
              {item.category && (
                <span className="text-[10px] text-muted-foreground">{item.category}</span>
              )}
              {isMeetup && item.free !== undefined && (
                <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${item.free ? "bg-green-500/15 text-green-500" : "bg-orange-500/15 text-orange-500"}`}>
                  {item.free ? "Gratis" : item.price ? `$${item.price}` : "Pago"}
                </Badge>
              )}
            </div>
            <h3 className="mt-1.5 font-semibold text-sm text-foreground leading-snug line-clamp-2">{item.title}</h3>
          </div>

          {/* Date: avatar del creador */}
          {isDate && (
            <Avatar className="h-10 w-10 shrink-0 border-2 border-secondary/40">
              <AvatarImage src={item.creatorPhotoUrl} />
              <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                {item.creatorUsername?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {item.dateTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(item.dateTime), "d MMM · HH:mm", { locale: es })}
            </span>
          )}
          {item.locationZone && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {item.locationZone}
            </span>
          )}
          {isDate && item.distance !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              {item.distance.toFixed(1)} km
            </span>
          )}
          {isDate && item.compatibility !== undefined && item.compatibility > 0 && (
            <span className="flex items-center gap-1 text-xs text-secondary font-semibold">
              <Heart className="h-3.5 w-3.5" />
              {item.compatibility}% compat.
            </span>
          )}
          {isMeetup && item.maxGuests !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {item.currentApprovedCount ?? 0}/{item.maxGuests}
              {item.full && <span className="text-destructive font-semibold ml-1">Lleno</span>}
            </span>
          )}
        </div>

        {/* Descripción */}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isMeetup && (
              <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={item.creatorPhotoUrl} />
                <AvatarFallback className="text-[9px] bg-muted">{item.creatorUsername?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <span className="text-xs text-muted-foreground">@{item.creatorUsername}</span>
            {isMeetup && typeof item.creatorReputation === "number" && !Number.isNaN(item.creatorReputation) && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                <Star className="size-3 shrink-0 fill-primary/30" aria-hidden />
                {Math.round(item.creatorReputation)}
              </span>
            )}
          </div>
          {item.createdAt && (
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: es })}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default function ActivityFeedPage() {
  const router = useRouter()
  const { te } = useI18n()
  const [items, setItems] = useState<UnifiedFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<FeedItemType | undefined>(undefined)
  const [sort, setSort] = useState<"NEWER" | "OLDER">("NEWER")

  const load = useCallback(async (filter: ActivityFeedFilter) => {
    setLoading(true)
    try {
      const data = await activityFeedService.getFeed(filter)
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load({ type: typeFilter, sort })
  }, [typeFilter, sort, load])

  const handleClick = (item: UnifiedFeedItem) => {
    if (item.type === "MEETUP") router.push(`/events/${item.id}`)
    // DATE cards no tienen página de detalle propia aún
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Actividades</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {te("Meetups y eventos cerca de ti", "Meetups and events near you")}
        </p>
      </div>

      {/* Filtros de tipo */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TYPE_FILTERS.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setTypeFilter(f.value)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              typeFilter === f.value
                ? "bg-primary text-black border-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {(["NEWER", "OLDER"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              sort === s ? "bg-muted text-foreground border-border" : "border-transparent text-muted-foreground"
            }`}
          >
            {s === "NEWER" ? te("Más recientes", "Newest") : te("Más antiguos", "Oldest")}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <Zap className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {te("No hay actividades disponibles", "No activities available")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <ActivityCard key={`${item.type}-${item.id}`} item={item} onClick={() => handleClick(item)} />
          ))}
        </div>
      )}
    </div>
  )
}
