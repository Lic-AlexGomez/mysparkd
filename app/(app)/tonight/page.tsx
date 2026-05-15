"use client"

import Link from "next/link"
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns"
import { enUS, es as esLocale } from "date-fns/locale"
import {
  Loader2,
  Radio,
  RefreshCw,
  Ticket,
  Users,
  User,
  Heart,
  MapPin,
  Clock,
  ChevronRight,
  MessageCircle,
  Calendar,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

import { useTonight } from "@/hooks/use-tonight"
import { useI18n } from "@/lib/i18n"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { locationService } from "@/lib/services/location"
import { useAuth } from "@/lib/auth-context"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

import type { SupportedLanguage } from "@/lib/i18n"
import type {
  TonightEventItem,
  TonightActiveUserItem,
  TonightGroupItem,
  TonightPlanItem,
  TonightRealtimeStatus,
} from "@/lib/types/tonight"

type Tab = "events" | "people" | "groups" | "plans"

function pickLocale(lang: SupportedLanguage) {
  return lang === "es" ? esLocale : enUS
}

function relative(iso?: string, locale?: Locale) {
  if (!iso) return null
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale,
    })
  } catch {
    return null
  }
}

function eventDateLabel(date: string, locale: Locale) {
  try {
    const d = new Date(date)

    if (isToday(d)) {
      return `Hoy • ${format(d, "h:mm a", { locale })}`
    }

    if (isTomorrow(d)) {
      return `Mañana • ${format(d, "h:mm a", { locale })}`
    }

    return format(d, "MMM d • h:mm a", { locale })
  } catch {
    return ""
  }
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    color: string
    dot: string
  }
> = {
  LIVE: {
    label: "EN VIVO",
    color: "text-red-400",
    dot: "bg-red-400",
  },
  STARTING_SOON: {
    label: "PRONTO",
    color: "text-orange-400",
    dot: "bg-orange-400",
  },
  RSVP_SPIKE: {
    label: "TRENDING",
    color: "text-cyan-400",
    dot: "bg-cyan-400",
  },
  ONLINE_NOW: {
    label: "ONLINE",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  PLANNING: {
    label: "PLANEANDO",
    color: "text-violet-400",
    dot: "bg-violet-400",
  },
}

function StatusBadge({
  status,
}: {
  status?: TonightRealtimeStatus
}) {
  if (!status) return null

  const cfg = STATUS_CONFIG[status]

  if (!cfg) return null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[9px] font-black tracking-widest backdrop-blur-md",
        cfg.color
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full animate-pulse",
          cfg.dot
        )}
      />
      {cfg.label}
    </span>
  )
}

/* ───────────────── EVENT CARD ───────────────── */

function EventCard({
  ev,
  locale,
  index,
}: {
  ev: TonightEventItem
  locale: Locale
  index: number
}) {

  console.log("EVENT:", ev)
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
    >
     <Link href={typeof ev.id === "string" ? `/events/${ev.id}` : "#"}
        className="
          group relative flex flex-col overflow-hidden
          rounded-3xl
          border border-white/10
          bg-gradient-to-b from-white/8 to-white/[0.03]
          backdrop-blur-xl
          shadow-[0_8px_30px_rgba(0,0,0,0.35)]
          transition-all duration-500
          hover:-translate-y-1
          hover:border-cyan-400/40
          hover:shadow-cyan-500/10
        "
      >
        {/* IMAGE */}
        <div className="relative h-52 w-full overflow-hidden">
        {typeof ev.coverImageUrl === "string" ? (
          <img
            src={ev.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-cyan-900/20">
              <div className="flex h-full items-center justify-center">
                <Ticket className="h-14 w-14 text-white/10" />
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />

          {/* HOT */}
          {index === 0 && (
            <div className="absolute right-3 top-3 rounded-full bg-cyan-400 px-2 py-1 text-[9px] font-black text-black shadow-lg">
              HOT
            </div>
          )}

          {/* STATUS */}
          <div className="absolute left-3 top-3">
            <StatusBadge status={ev.realTimeStatus} />
          </div>

          {/* ATTENDEES */}
          {ev.attendeePreviewCount != null &&
            ev.attendeePreviewCount > 0 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-md">
                <Users className="h-3 w-3 text-white/70" />
                <span className="text-[10px] font-bold text-white">
                  {ev.attendeePreviewCount}
                </span>
              </div>
            )}
        </div>

        {/* CONTENT */}
        <div className="flex flex-col gap-3 p-4">
          <div>
            <p className="line-clamp-2 text-base font-black leading-tight text-white transition-colors group-hover:text-cyan-300">
              {ev.title}
            </p>
            {ev.organizerName && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
                <User className="h-3 w-3" />
                {ev.organizerName}
              </p>
            )}
          </div>

          {ev.summary && (
            <p className="line-clamp-2 text-[12px] leading-snug text-white/50">
              {ev.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {ev.eventTime && (
              <span className="flex items-center gap-1 text-[11px] text-white/60">
                <Clock className="h-3 w-3 shrink-0" />
                <span>
                  {eventDateLabel(ev.eventTime, locale)}
                </span>
                {ev.endTime && (
                  <span className="text-white/30">— {eventDateLabel(ev.endTime, locale)}</span>
                )}
              </span>
            )}

            {ev.venueLabel ? (
              <span className="flex items-center gap-1 text-[11px] text-white/50">
                <MapPin className="h-3 w-3 shrink-0" />
                {ev.venueLabel}
              </span>
            ) : ev.distanceKm != null ? (
              <span className="flex items-center gap-1 text-[11px] text-white/50">
                <MapPin className="h-3 w-3 shrink-0" />
                {ev.distanceKm.toFixed(1)} km
              </span>
            ) : null}
          </div>

          {/* STATS ROW */}
          <div className="flex items-center gap-3 flex-wrap">
            {ev.category && (
              <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/60">
                {ev.category}
              </span>
            )}

            {ev.price && parseFloat(ev.price) > 0 ? (
              <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-black text-cyan-400">
                RD${parseFloat(ev.price).toLocaleString()}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-black text-emerald-400">
                GRATIS
              </span>
            )}

            <div className="ml-auto flex items-center gap-3">
              {ev.likesCount != null && ev.likesCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-white/40">
                  <Heart className="h-3 w-3" />
                  {ev.likesCount}
                </span>
              )}
              {ev.attendeePreviewCount != null && ev.attendeePreviewCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-white/40">
                  <Users className="h-3 w-3" />
                  {ev.attendeePreviewCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/* ───────────────── PEOPLE CARD ───────────────── */

function PersonCard({
  u,
  locale,
}: {
  u: TonightActiveUserItem
  locale: Locale
}) {
  const name = u.displayName?.trim() || u.username
  const rel = relative(u.lastActiveAt, locale)

  return (
    <Link
      href={`/profile/${u.userId}`}
      className="
        group flex items-center gap-3
        rounded-3xl
        border border-white/10
        bg-white/[0.03]
        backdrop-blur-xl
        p-4
        transition-all duration-300
        hover:border-violet-500/30
        hover:bg-white/[0.05]
      "
    >
      <div className="relative shrink-0">
        <Avatar className="h-14 w-14 border border-white/10">
          <AvatarImage
            src={u.profilePictureUrl ?? undefined}
            alt=""
            className="object-cover"
          />

          <AvatarFallback className="bg-violet-900/50 text-sm font-black text-violet-300">
            {(u.username || "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-black",
            u.realTimeStatus === "ONLINE_NOW"
              ? "bg-emerald-400 animate-pulse"
              : "bg-white/20"
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white group-hover:text-violet-300">
          {name}
        </p>

        {u.activityHint ? (
          <p className="truncate text-[11px] text-white/50">
            {u.activityHint}
          </p>
        ) : rel ? (
          <p className="truncate text-[11px] text-white/40">
            {rel}
          </p>
        ) : null}

        {u.username &&
          u.displayName &&
          u.username !== u.displayName && (
            <p className="truncate text-[10px] text-white/25">
              @{u.username}
            </p>
          )}
      </div>

      <StatusBadge status={u.realTimeStatus} />
    </Link>
  )
}

/* ───────────────── GROUP CARD ───────────────── */

function GroupCard({
  g,
  locale,
}: {
  g: TonightGroupItem
  locale: Locale
}) {
  const rel = relative(g.eventTime, locale)

  return (
    <Link
      href={`/groups/${g.groupId}`}
      className="
        group flex flex-col gap-3
        rounded-3xl
        border border-white/10
        bg-white/[0.03]
        backdrop-blur-xl
        p-5
        transition-all duration-300
        hover:border-violet-500/30
      "
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-black text-white group-hover:text-violet-300">
          {g.name}
        </p>

        <StatusBadge status={g.realTimeStatus} />
      </div>

      {g.planningSnippet && (
        <p className="line-clamp-2 text-[12px] leading-relaxed text-white/50">
          {g.planningSnippet}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/40">
        {g.memberActiveCount != null && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {g.memberActiveCount} activos
          </span>
        )}

        {rel && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {rel}
          </span>
        )}

        {g.distanceKm != null && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {g.distanceKm.toFixed(1)} km
          </span>
        )}
      </div>
    </Link>
  )
}

/* ───────────────── PLAN CARD ───────────────── */

function PlanCard({
  p,
  locale,
}: {
  p: TonightPlanItem
  locale: Locale
}) {
  const rel = relative(p.eventTime, locale)

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-black text-white">
          {p.title}
        </p>

        <StatusBadge status={p.realTimeStatus} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-white/40">
        {p.authorUsername && <span>@{p.authorUsername}</span>}

        {rel && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {rel}
          </span>
        )}

        {p.venueLabel && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {p.venueLabel}
          </span>
        )}

        {p.participantCount != null && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {p.participantCount}
          </span>
        )}
      </div>

      <Link
        href="/chat"
        className="
          mt-1 flex items-center justify-center gap-2
          rounded-2xl
          border border-violet-500/20
          bg-violet-500/10
          py-3
          text-xs font-black tracking-widest
          text-violet-300
          transition-all
          hover:bg-violet-500/20
        "
      >
        <MessageCircle className="h-3.5 w-3.5" />
        UNIRSE AL CHAT
      </Link>
    </div>
  )
}

/* ───────────────── EMPTY STATE ───────────────── */

function EmptyTab({ tab }: { tab: Tab }) {
  const msgs: Record<
    Tab,
    {
      icon: React.ReactNode
      title: string
      sub: string
    }
  > = {
    events: {
      icon: <Ticket className="h-10 w-10 text-white/15" />,
      title: "Sin eventos próximos",
      sub: "Vuelve más tarde o explora /events",
    },
    people: {
      icon: <Users className="h-10 w-10 text-white/15" />,
      title: "Nadie activo cerca",
      sub: "Sé el primero en aparecer aquí",
    },
    groups: {
      icon: <Users className="h-10 w-10 text-white/15" />,
      title: "Sin grupos activos",
      sub: "Crea un plan con tu grupo",
    },
    plans: {
      icon: <Calendar className="h-10 w-10 text-white/15" />,
      title: "Sin planes espontáneos",
      sub: "Propón algo y encuentra gente",
    },
  }

  const m = msgs[tab]

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      {m.icon}

      <p className="text-sm font-bold text-white/40">
        {m.title}
      </p>

      <p className="text-xs text-white/25">{m.sub}</p>
    </div>
  )
}

/* ───────────────── PAGE ───────────────── */

export default function TonightPage() {
  const { language } = useI18n()
  const { user } = useAuth()

  const features = useFeatureFlags()
  const router = useRouter()

  const locale = pickLocale(language)

  const [coords, setCoords] = useState<
    | {
        lat: number
        lng: number
      }
    | undefined
  >()

  const [tab, setTab] = useState<Tab>("events")

  useEffect(() => {
    if (!features.tonightPage) {
      router.replace("/feed")
    }
  }, [features.tonightPage, router])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const loc = await locationService.getCurrentLocation()

        if (
          !cancelled &&
          loc?.latitude != null &&
          loc?.longitude != null
        ) {
          setCoords({
            lat: loc.latitude,
            lng: loc.longitude,
          })
        }
      } catch {
        const raw =
          typeof window !== "undefined"
            ? window.localStorage.getItem("sparkd_location")
            : null

        if (!cancelled && raw) {
          try {
            const j = JSON.parse(raw) as {
              latitude?: number
              longitude?: number
            }

            if (
              j.latitude != null &&
              j.longitude != null
            ) {
              setCoords({
                lat: j.latitude,
                lng: j.longitude,
              })
            }
          } catch {}
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.userId])

  const tonight = useTonight({
    lat: coords?.lat,
    lng: coords?.lng,
    pollMs: 45_000,
  })

  const {
    events,
    activeUsers,
    groups,
    plans,
    loading,
    updatedAt,
    refresh,
    totalLive,
  } = tonight

  const [sortByDate, setSortByDate] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 20

  console.log("[TonightPage] Hook data:", { events_count: events?.length, loading, coords })
  console.log("[TonightPage] Events from hook:", events)

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    events.forEach(e => { if (e.category) cats.add(e.category) })
    return Array.from(cats).sort()
  }, [events])

  const filteredEvents = useMemo(() => {
    let arr = [...events]
    if (selectedCategory) {
      arr = arr.filter(e => e.category === selectedCategory)
    }
    if (priceFilter === "free") {
      arr = arr.filter(e => !e.price || e.price === "0" || e.price === "0.00")
    } else if (priceFilter === "paid") {
      arr = arr.filter(e => e.price && parseFloat(e.price) > 0)
    }
    if (sortByDate) {
      arr.sort((a, b) => {
        const ta = a.eventTime ? new Date(a.eventTime).getTime() : Infinity
        const tb = b.eventTime ? new Date(b.eventTime).getTime() : Infinity
        return ta - tb
      })
    }
    return arr
  }, [events, selectedCategory, priceFilter, sortByDate])

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredEvents.slice(start, start + PAGE_SIZE)
  }, [filteredEvents, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))

  const tabs: {
    id: Tab
    label: string
    count: number
  }[] = [
    {
      id: "events",
      label: "Eventos",
      count: filteredEvents.length,
    },
    {
      id: "people",
      label: "Gente",
      count: activeUsers.length,
    },
    {
      id: "groups",
      label: "Grupos",
      count: groups.length,
    },
    {
      id: "plans",
      label: "Planes",
      count: plans.length,
    },
  ]

  if (!features.tonightPage) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,#111827_0%,#050505_45%)] pb-32 lg:pb-12">
      {/* HERO */}

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="absolute left-1/4 top-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative px-4 pb-8 pt-14 text-center">
          <div className="mb-5 flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />

              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-red-400">
              LIVE TONIGHT
            </span>
          </div>

          <h1 className="mb-3 text-5xl font-black leading-none tracking-tight text-white">
            ¿Qué pasa
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              esta noche?
            </span>
          </h1>

          <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/50">
            {coords
              ? "Mostrando lo mejor cerca de ti"
              : "Activa tu ubicación para descubrir eventos cercanos"}
          </p>

          <div className="mt-6 flex justify-center">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {totalLive > 0 && (
            <div className="mt-7 flex items-center justify-center gap-7">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-cyan-400">
                  {filteredEvents.length}
                </span>

                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                  Eventos
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-violet-400">
                  {activeUsers.length}
                </span>

                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                  Activos
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-emerald-400">
                  {groups.length}
                </span>

                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                  Grupos
                </span>
              </div>
            </div>
          )}
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setSortByDate(s => !s)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition-all",
                    sortByDate ? "bg-cyan-500 text-black" : "bg-white/[0.04] text-white/60 hover:bg-white/10"
                  )}
                >
                  {sortByDate ? "Ordenado por fecha" : "Organizar por fecha"}
                </button>
                <button
                  onClick={() => setPriceFilter(f => f === "all" ? "free" : f === "free" ? "paid" : "all")}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition-all",
                    priceFilter === "all" ? "bg-white/[0.04] text-white/60" :
                    priceFilter === "free" ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400"
                  )}
                >
                  {priceFilter === "all" ? "Todos" : priceFilter === "free" ? "Gratis" : "Pago"}
                </button>
              </div>

              <button
                onClick={() => void refresh()}
                disabled={loading}
                className="
                  mt-1 flex items-center gap-2
                  rounded-full border border-white/10
                  bg-white/[0.04]
                  px-4 py-2
                  text-[11px] font-bold
                  text-white/60
                  transition-all
                  hover:border-white/20
                  hover:text-white
                "
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}

                {updatedAt
                  ? `Actualizado ${relative(
                      updatedAt.toISOString(),
                      locale
                    )}`
                  : "Actualizar"}
              </button>
            </div>
        </div>
      </div>

      {/* TABS */}

      <div className="sticky top-0 z-20 bg-black/50 px-4 pb-4 pt-2 backdrop-blur-2xl">
        <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-[11px] font-black tracking-wide transition-all",
                tab === t.id
                  ? "bg-white text-black"
                  : "text-white/35 hover:text-white/60"
              )}
            >
              {t.label}

              {t.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-black",
                    tab === t.id
                      ? "bg-black/10 text-black"
                      : "bg-white/10 text-white/30"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY FILTER BAR */}
      {tab === "events" && allCategories.length > 0 && (
        <div className="sticky top-[72px] z-10 bg-black/40 px-4 pb-2 pt-1 backdrop-blur-xl">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => { setSelectedCategory(null); setCurrentPage(1) }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                !selectedCategory
                  ? "bg-white text-black"
                  : "bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/80"
              )}
            >
              Todas
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat === selectedCategory ? null : cat); setCurrentPage(1) }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedCategory === cat
                    ? "bg-cyan-400 text-black"
                    : "bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/80"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT */}

      <div className="space-y-4 px-4 pt-2">
        {loading && totalLive === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="relative">
              <Radio className="h-10 w-10 text-violet-500/50" />

              <Loader2 className="absolute inset-0 h-10 w-10 animate-spin text-cyan-400/60" />
            </div>

            <p className="text-sm text-white/30">
              Buscando actividad cerca...
            </p>
          </div>
        ) : (
          <>
            {tab === "events" &&
              (filteredEvents.length > 0 ? (
                <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  {paginatedEvents.map((ev, index) => (
                    <EventCard
                      key={ev.id}
                      ev={ev}
                      locale={locale}
                      index={index}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 pb-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white/40 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20"
                    >
                      ‹
                    </button>
                    {(() => {
                      const pages: (number | "...")[] = []
                      const SIB = 1
                      const start = Math.max(1, currentPage - SIB)
                      const end = Math.min(totalPages, currentPage + SIB)
                      if (start > 2) pages.push(1, 2, "...")
                      else if (start === 2) pages.push(1)
                      for (let i = start; i <= end; i++) pages.push(i)
                      if (end < totalPages - 1) pages.push("...", totalPages - 1, totalPages)
                      else if (end === totalPages - 1) pages.push(totalPages)
                      return pages
                    })().map((p, i) =>
                      p === "..." ? (
                        <span key={`e${i}`} className="flex h-8 w-6 items-center justify-center text-[11px] text-white/30">
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black transition-all",
                            p === currentPage
                              ? "bg-cyan-400 text-black"
                              : "bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/80"
                          )}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white/40 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20"
                    >
                      ›
                    </button>
                  </div>
                )}
                </>
              ) : (
                <EmptyTab tab="events" />
              ))}

            {tab === "people" &&
              (activeUsers.length > 0 ? (
                <div className="space-y-3">
                  {activeUsers.map(u => (
                    <PersonCard
                      key={u.userId}
                      u={u}
                      locale={locale}
                    />
                  ))}
                </div>
              ) : (
                <EmptyTab tab="people" />
              ))}

            {tab === "groups" &&
              (groups.length > 0 ? (
                <div className="space-y-4">
                  {groups.map(g => (
                    <GroupCard
                      key={g.groupId}
                      g={g}
                      locale={locale}
                    />
                  ))}
                </div>
              ) : (
                <EmptyTab tab="groups" />
              ))}

            {tab === "plans" &&
              (plans.length > 0 ? (
                <div className="space-y-4">
                  {plans.map(p => (
                    <PlanCard
                      key={p.planId}
                      p={p}
                      locale={locale}
                    />
                  ))}
                </div>
              ) : (
                <EmptyTab tab="plans" />
              ))}
          </>
        )}

        {!loading && totalLive === 0 && (
          <div className="mt-6 flex flex-col gap-4">
            <Link
              href="/events"
              className="
                flex items-center justify-between
                rounded-3xl
                border border-cyan-500/20
                bg-cyan-500/5
                px-5 py-4
                transition-all
                hover:bg-cyan-500/10
              "
            >
              <div className="flex items-center gap-3">
                <Ticket className="h-5 w-5 text-cyan-400" />

                <div>
                  <p className="text-sm font-black text-white">
                    Ver todos los eventos
                  </p>

                  <p className="text-[11px] text-white/40">
                    Descubre qué hay en tu ciudad
                  </p>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-white/30" />
            </Link>

            <Link
              href="/groups"
              className="
                flex items-center justify-between
                rounded-3xl
                border border-violet-500/20
                bg-violet-500/5
                px-5 py-4
                transition-all
                hover:bg-violet-500/10
              "
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-violet-400" />

                <div>
                  <p className="text-sm font-black text-white">
                    Explorar grupos
                  </p>

                  <p className="text-[11px] text-white/40">
                    Encuentra tu tribu
                  </p>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-white/30" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}