"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import type { DateCard, Interest } from "@/lib/types"
import { compatibilityPercentFromInterestsOnly } from "@/lib/services/compatibility"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Calendar, Clock, Flame, Heart, MapPin, Sparkles, Users, Zap } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { enUS, es } from "date-fns/locale"

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "🍽️ Comida",
  ACTIVITY: "🎯 Actividad",
  EVENT: "🎉 Evento",
  CHILL: "😌 Chill",
  ADVENTURE: "🏔️ Aventura",
  OPEN_SUGGESTION: "💡 Abierto",
}

const FAST_DATE_COVER_BACKGROUND =
  "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(255,255,255,0.18), transparent 50%), radial-gradient(circle at top left, #ff00aa, transparent 42%), radial-gradient(circle at bottom right, #ffb703, transparent 38%), radial-gradient(circle at 70% 40%, rgba(123,47,247,0.45), transparent 45%), linear-gradient(135deg, #7b2ff7, #f107a3)"

const NOISE_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")"

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
  emptyZoneLabel?: string
  hostAge?: number
  hostDisplayName?: string
  activeLabel?: string
  viewProfileLabel?: string
  joinCtaLabel?: string
  compatibleLabel?: string
  chatVibeLabel?: string
  interestedWord?: string
  potentialMatchesTemplate?: (n: number) => string
  yearsLabel?: string
  viewerInterests?: Array<string | Interest> | null
  compatOwnHint?: string
  compatPendingHint?: string
  /** `es` | `en` — afecta formato de fecha y “expira en …”. */
  localeCode?: string
  /** Si no hay `locationZone`, se muestra esto (ej. “Aquí” / “Here”). */
  hereLabel?: string
  te?: (es: string, en: string) => string
}

export function FastDateOfferCard({
  card,
  currentUserId,
  onInterest,
  className,
  fastDateLabel,
  interestLabel,
  expiresLabel,
  emptyZoneLabel,
  hostAge,
  hostDisplayName,
  activeLabel = "Activo",
  viewProfileLabel = "Ver perfil",
  joinCtaLabel,
  compatibleLabel = "compatible",
  chatVibeLabel = "💬 Charlar",
  interestedWord = "interesados",
  potentialMatchesTemplate = (n) => `❤️ ${n} matches potenciales cerca`,
  yearsLabel = "años",
  viewerInterests,
  compatOwnHint = "Tu Fast Date",
  compatPendingHint = "Sin datos",
  localeCode = "es",
  hereLabel,
  te,
}: FastDateOfferCardProps) {
  const router = useRouter()
  const isOwn = card.userId === currentUserId
  const joinLabel = joinCtaLabel ?? interestLabel
  const coverUrl = card.coverImageUrl?.trim()
  const headlineName = (hostDisplayName || card.displayName?.trim() || "").trim()
  const quoteText = (card.message ?? card.detail)?.trim()

  const ext = card as DateCard & {
    liveViewerCount?: number
    viewerCount?: number
    trendingNearby?: boolean
  }
  const viewingNow =
    typeof ext.liveViewerCount === "number"
      ? ext.liveViewerCount
      : typeof ext.viewerCount === "number"
        ? ext.viewerCount
        : null

  const zoneTrimmed = card.locationZone?.trim() ?? ""
  const zoneLine =
    zoneTrimmed ||
    (hereLabel?.trim() ||
      emptyZoneLabel?.trim() ||
      "—")

  const dfLocale = localeCode.toLowerCase().startsWith("en") ? enUS : es

  const whenLine = format(new Date(card.dateTime), "EEE d MMM · HH:mm", {
    locale: dfLocale,
  })
    .replace(/\./g, "")
    .trim()
    .toLowerCase()

  const vibeTags: string[] = []
  const cat = CATEGORY_LABELS[card.category]
  if (cat) vibeTags.push(cat)
  for (const p of card.plans ?? []) {
    const lbl = PLAN_LABELS[p] || p
    if (!vibeTags.includes(lbl)) vibeTags.push(lbl)
  }
  if (quoteText && chatVibeLabel) vibeTags.push(chatVibeLabel)

  const totalInterested =
    typeof card.totalInterests === "number" && card.totalInterests >= 0
      ? card.totalInterests
      : null
  const interestCompat =
    !isOwn
      ? compatibilityPercentFromInterestsOnly(viewerInterests, card.authorInterests)
      : null
  const backendCompatRaw = card.compatibility
  const backendCompat =
    typeof backendCompatRaw === "number" &&
    Number.isFinite(backendCompatRaw)
      ? Math.round(Math.min(100, Math.max(0, backendCompatRaw)))
      : null
  const displayCompat =
    !isOwn && interestCompat !== null
      ? interestCompat
      : !isOwn && backendCompat !== null
        ? backendCompat
        : null
  const compatBarPercent =
    isOwn ? 0 : displayCompat !== null ? displayCompat : 0
  const compatCaption = isOwn
    ? `💜 ${compatOwnHint}`
    : displayCompat !== null
      ? `💜 ${displayCompat}% ${compatibleLabel}`
      : `💜 ${compatPendingHint} · ${compatibleLabel}`
  const nearby =
    card.nearbyMatches != null && card.nearbyMatches > 0
      ? Math.round(card.nearbyMatches)
      : null

  const showStatsBlock =
    (totalInterested != null && totalInterested > 0) || nearby != null

  const hasLiveViewers = viewingNow != null && viewingNow > 0
  const trendingOptOut = ext.trendingNearby === false
  const showTrendingFallback = !hasLiveViewers && !isOwn && !trendingOptOut

  let activityText: string | null = null
  let activityKind: "viewing" | "trending" | null = null
  if (hasLiveViewers && viewingNow != null) {
    activityKind = "viewing"
    activityText =
      viewingNow === 1
        ? te
          ? te("🟢 1 persona viendo ahora", "🟢 1 viewing now")
          : "🟢 1 persona viendo ahora"
        : te
          ? te(
              `🟢 ${viewingNow} personas viendo ahora`,
              `🟢 ${viewingNow} viewing now`
            )
          : `🟢 ${viewingNow} personas viendo ahora`
  } else if (showTrendingFallback) {
    activityKind = "trending"
    activityText = te
      ? te("🔥 Trending cerca de ti", "🔥 Trending near you")
      : "🔥 Trending cerca de ti"
  }

  const openProfile = () => {
    if (card.userId) router.push(`/profile/${card.userId}`)
  }

  const ageYears =
    hostAge != null && hostAge > 0
      ? hostAge
      : card.authorAge != null && card.authorAge > 0
        ? card.authorAge
        : null

  const divider = "border-t border-white/[0.085] dark:border-white/[0.075]"

  return (
    <motion.div
      initial={false}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className={cn("rounded-2xl will-change-transform", className)}
    >
      <Card
        className={cn(
          "group/card relative gap-0 overflow-hidden rounded-2xl border border-white/[0.085] bg-card/[0.88] py-0 shadow-[0_6px_32px_-14px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:border-fuchsia-400/22 hover:shadow-[0_22px_56px_-18px_rgba(236,72,153,0.38),0_0_96px_-30px_rgba(139,92,246,0.26),inset_0_1px_0_rgba(255,255,255,0.09)]"
        )}
      >
        <div
          className="relative isolate min-h-[7.25rem] w-full overflow-hidden"
          style={{ backgroundImage: FAST_DATE_COVER_BACKGROUND }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,182,193,0.22),transparent_48%)] opacity-90 mix-blend-screen"
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(255,255,255,0.14),transparent_58%)] mix-blend-soft-light"
            aria-hidden
            animate={{ opacity: [0.78, 0.93, 0.78] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="pointer-events-none absolute inset-0 shadow-[inset_0_-28px_44px_rgba(10,6,18,0.55),inset_0_0_80px_rgba(10,6,24,0.35)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]"
            style={{ backgroundImage: NOISE_DATA_URI }}
            aria-hidden
          />
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-[0.76] transition-opacity duration-500 ease-out group-hover/card:opacity-[0.86]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/94 via-violet-950/42 to-violet-950/10" />
            </>
          ) : null}
          <div className="relative flex min-h-[inherit] flex-col justify-between p-2.5 sm:p-3">
            <div className="flex flex-wrap items-start justify-between gap-1.5">
              <Badge className="gap-1 border border-white/18 bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-white shadow-[0_0_24px_-4px_rgba(251,191,36,0.42)] backdrop-blur-md">
                <Zap className="size-3.5 shrink-0 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.75)]" aria-hidden />
                {fastDateLabel}
              </Badge>
              {card.status === "ACTIVE" && (
                <Badge className="gap-1 border border-orange-400/32 bg-gradient-to-r from-orange-500 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_6px_22px_-6px_rgba(249,115,22,0.62)] backdrop-blur-sm">
                  <Flame className="size-3.5 shrink-0" aria-hidden />
                  {activeLabel}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardContent className="space-y-0 p-0">
          <div className="relative px-3 pb-2 pt-0 sm:px-3.5">
            <div className="-mt-9 flex gap-2.5">
              <motion.div
                className="relative shrink-0"
                whileHover={{ scale: 1.035 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              >
                <Avatar
                  className={cn(
                    "size-[4.125rem] cursor-pointer border-[3px] border-background shadow-[0_14px_42px_-12px_rgba(168,85,247,0.72),0_0_0_1px_rgba(255,255,255,0.14),inset_0_1px_0_rgba(255,255,255,0.22)] ring-[3px] ring-fuchsia-400/40 ring-offset-0 transition-shadow duration-500",
                    "group-hover/card:shadow-[0_18px_48px_-10px_rgba(236,72,153,0.58),0_0_52px_-16px_rgba(167,139,250,0.35)] group-hover/card:ring-fuchsia-300/55"
                  )}
                  onClick={openProfile}
                >
                  <AvatarImage src={card.mainPhotoUrl} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-fuchsia-600/45 via-violet-600/32 to-amber-500/28 text-lg font-bold text-white">
                    {card.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                {card.status === "ACTIVE" ? (
                  <span className="absolute bottom-1 right-1 flex size-3 items-center justify-center rounded-full bg-emerald-400 shadow-[0_0_0_2px_hsl(var(--card)),0_0_14px_rgba(52,211,153,0.85)] ring-2 ring-emerald-300/70">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/45 [animation-duration:2.2s]" aria-hidden />
                    <span className="relative size-1.5 rounded-full bg-emerald-100" aria-hidden />
                  </span>
                ) : null}
              </motion.div>
              <div className="min-w-0 flex-1 space-y-0.5 pt-8 sm:pt-9">
                {headlineName ? (
                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
                    {headlineName}
                  </p>
                ) : null}
                <h3 className="line-clamp-2 text-[1.0625rem] font-bold leading-[1.28] tracking-[-0.02em] text-zinc-50 drop-shadow-[0_1px_18px_rgba(0,0,0,0.35)]">
                  {card.title}
                </h3>
                <p className="truncate text-[13px] leading-snug tracking-[-0.01em] text-zinc-400">
                  <button
                    type="button"
                    onClick={openProfile}
                    className="font-semibold text-fuchsia-400 underline-offset-2 transition-colors hover:text-fuchsia-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/45 rounded-sm"
                  >
                    @{card.username}
                  </button>
                  {ageYears != null ? (
                    <span className="text-zinc-500">
                      {" "}
                      · {ageYears} {yearsLabel}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>

            {quoteText ? (
              <div className="mt-2 flex gap-2 rounded-[0.875rem] border border-white/[0.09] bg-white/[0.045] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md dark:bg-black/28">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" aria-hidden />
                <p className="line-clamp-3 text-[13px] italic leading-snug tracking-[-0.01em] text-zinc-100">
                  &ldquo;{quoteText}&rdquo;
                </p>
              </div>
            ) : null}
          </div>

          <div className={divider} />

          <div className="space-y-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5">
            <div className="flex flex-col gap-1 px-px text-[12px] leading-snug tracking-[-0.01em] text-zinc-400">
              <div className="flex items-start gap-2 font-semibold text-zinc-200">
                <Calendar
                  className="mt-0.5 size-3.5 shrink-0 text-fuchsia-400 drop-shadow-[0_0_12px_rgba(217,70,239,0.42)]"
                  aria-hidden
                />
                <span className="min-w-0 lowercase">{whenLine}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin
                  className="mt-0.5 size-3.5 shrink-0 text-fuchsia-400/95"
                  aria-hidden
                />
                <span className="min-w-0 truncate font-medium text-zinc-300">
                  {zoneLine}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock
                  className="mt-0.5 size-3.5 shrink-0 text-fuchsia-400/95"
                  aria-hidden
                />
                <span className="min-w-0">
                  {expiresLabel}{" "}
                  {formatDistanceToNow(new Date(card.expiresAt), {
                    addSuffix: true,
                    locale: dfLocale,
                  })}
                </span>
              </div>
              {activityText ? (
                <div
                  role="status"
                  className={cn(
                    "flex items-start gap-2 font-bold text-zinc-200",
                    activityKind === "viewing" ? "text-emerald-50" : ""
                  )}
                >
                  {activityKind === "viewing" ? (
                    <span
                      className="mt-1 inline-flex size-2 shrink-0 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.85)]"
                      aria-hidden
                    />
                  ) : null}
                  <span className="min-w-0 leading-snug">{activityText}</span>
                </div>
              ) : null}
            </div>

            {vibeTags.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {vibeTags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/[0.1] bg-white/[0.055] px-2 py-0.5 text-[11px] font-semibold tracking-[-0.01em] text-zinc-100 shadow-[0_2px_12px_-6px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-fuchsia-400/30 hover:bg-white/[0.095] hover:shadow-[0_4px_16px_-8px_rgba(236,72,153,0.28)] active:scale-[0.97]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {showStatsBlock ? (
            <>
              <div className={divider} />
              <div className="space-y-1.5 px-3 py-2 sm:px-3.5">
                {totalInterested != null && totalInterested > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-[0.875rem] border border-white/[0.07] bg-white/[0.035] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md dark:bg-black/26">
                    <div className="flex -space-x-2 ps-0.5" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-zinc-600/90 to-zinc-800/80 shadow-[0_6px_16px_-6px_rgba(236,72,153,0.35)]"
                        >
                          <Users className="size-3 text-zinc-300/90" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[12px] font-bold tracking-[-0.015em] text-zinc-100">
                      {totalInterested > 3
                        ? `👤👤👤 +${totalInterested - 3} ${interestedWord}`
                        : `${totalInterested} ${interestedWord}`}
                    </span>
                  </div>
                ) : null}
                {nearby != null ? (
                  <p className="text-[12px] font-semibold tracking-[-0.01em] text-zinc-400">
                    {potentialMatchesTemplate(nearby)}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className={divider} />
          <div className="space-y-1 px-3 py-2 sm:px-3.5">
            <div
              className={cn(
                "h-2 overflow-hidden rounded-full bg-white/[0.07] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.07]",
                isOwn && "opacity-90"
              )}
              role={isOwn ? "group" : "progressbar"}
              {...(isOwn
                ? { "aria-label": compatOwnHint }
                : {
                    "aria-valuemin": 0,
                    "aria-valuemax": 100,
                    "aria-valuenow":
                      displayCompat !== null ? displayCompat : 0,
                    ...(displayCompat === null
                      ? ({ "aria-valuetext": compatPendingHint } as const)
                      : {}),
                    "aria-label":
                      displayCompat !== null
                        ? `${compatibleLabel} ${displayCompat}%`
                        : `${compatibleLabel}: ${compatPendingHint}`,
                  })}
            >
              <motion.div
                className={cn(
                  "h-full min-h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_22px_-2px_rgba(217,70,239,0.58)]",
                  isOwn && "opacity-25",
                  !isOwn && displayCompat === null && "opacity-35"
                )}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, Math.max(0, compatBarPercent))}%`,
                }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p
              className={cn(
                "text-[11px] font-bold tracking-[0.02em] text-zinc-100",
                displayCompat !== null && !isOwn ? "tabular-nums" : ""
              )}
            >
              {compatCaption}
            </p>
          </div>

          <div className={divider} />
          <div className="flex flex-col gap-1.5 p-3 pb-3.5 sm:flex-row sm:items-stretch sm:p-3.5">
            {!isOwn ? (
              <motion.div className="flex-1" whileTap={{ scale: 0.985 }} transition={{ duration: 0.15 }}>
                <Button
                  size="sm"
                  className="h-10 w-full rounded-[0.875rem] border-0 bg-gradient-to-r from-fuchsia-500 via-violet-600 to-pink-500 font-bold text-black shadow-[0_8px_32px_-10px_rgba(236,72,153,0.72),0_0_48px_-14px_rgba(139,92,246,0.42)] transition-[filter,box-shadow] duration-300 ease-out hover:brightness-[1.08] hover:shadow-[0_12px_40px_-10px_rgba(236,72,153,0.82),0_0_56px_-12px_rgba(236,72,153,0.45)] active:brightness-95"
                  onClick={onInterest}
                >
                  <Zap className="mr-2 size-4" aria-hidden />
                  {joinLabel}
                </Button>
              </motion.div>
            ) : (
              <div className="flex min-h-10 flex-1 items-center justify-center rounded-[0.875rem] border border-dashed border-white/14 bg-white/[0.035] px-3 py-1.5 text-center text-[12px] font-medium text-zinc-500 backdrop-blur-sm">
                {fastDateLabel}
              </div>
            )}
            <motion.div className="flex-1" whileTap={{ scale: 0.985 }} transition={{ duration: 0.15 }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-full rounded-[0.875rem] border-white/[0.11] bg-white/[0.035] font-semibold text-zinc-100 shadow-none backdrop-blur-lg transition-all duration-300 ease-out hover:border-white/[0.18] hover:bg-white/[0.09] hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                onClick={openProfile}
              >
                <Heart className="mr-2 size-4 text-fuchsia-400/95" aria-hidden />
                {viewProfileLabel}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
