"use client"

import { useRouter } from "next/navigation"
import { profileHref } from "@/lib/profile-route"
import { motion } from "framer-motion"
import type { Event } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Flame,
  MapPin,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

export type MeetupCardEventModel = Event & {
  _id: string
  _title: string
  _description: string
}

type MeetupOfferCardProps = {
  event: MeetupCardEventModel
  te: (es: string, en: string) => string
  localeCode?: string
  currentUserId?: string | null
  joiningEventId: string | null
  onJoin: (eventId: string, availableSpots: number | null) => void
  className?: string
}

const MEETUP_COVER_BACKGROUND =
  "radial-gradient(ellipse 120% 80% at 50% -18%, rgba(255,255,255,0.14), transparent 52%), radial-gradient(circle at top left, #14b8a6, transparent 44%), radial-gradient(circle at bottom right, #06b6d4, transparent 40%), radial-gradient(circle at 30% 55%, rgba(8,145,178,0.38), transparent 46%), linear-gradient(135deg, #047857, #0891b2)"

const NOISE_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")"

const CATEGORY_VIBE: Record<
  string,
  { es: string; en: string }
> = {
  PARTY: { es: "🍻 Social", en: "🍻 Social" },
  DINNER: { es: "🍽️ Cena", en: "🍽️ Dinner" },
  CONCERT: { es: "🎵 Música", en: "🎵 Music" },
  SPORTS: { es: "⚽ Deporte", en: "⚽ Sports" },
  NETWORKING: { es: "🤝 Networking", en: "🤝 Networking" },
  OUTDOOR: { es: "🌴 Fun outdoor", en: "🌴 Fun outdoor" },
  GROUP_DATE: { es: "💕 Grupal", en: "💕 Group date" },
  CULTURAL: { es: "🎭 Cultura", en: "🎭 Cultural" },
  OTHER: { es: "✨ Chill", en: "✨ Chill" },
}

export function MeetupOfferCard({
  event,
  te,
  localeCode = "es",
  currentUserId,
  joiningEventId,
  onJoin,
  className,
}: MeetupOfferCardProps) {
  const router = useRouter()
  const ext = event as MeetupCardEventModel & {
    interestedCount?: number
    waitlistCount?: number
    liveViewerCount?: number
    viewerCount?: number
    trendingNearby?: boolean
    exactAddress?: string
    locationZone?: string
    location_zone?: string
    myRole?: string
    isAdmin?: boolean
    isMember?: boolean
  }

  const available = Math.max(
    0,
    Number(event.maxGuests || 0) - Number(event.currentApprovedCount || 0)
  )
  const officialAddress = String(
    event.officialAddress ||
      ext.exactAddress ||
      (event as MeetupCardEventModel & { official_address?: string }).official_address ||
      (event as MeetupCardEventModel & { address?: string }).address ||
      ""
  ).trim()
  const rawEv = event as MeetupCardEventModel & Record<string, unknown>
  const snakeZone =
    typeof rawEv.location_zone === "string"
      ? String(rawEv.location_zone).trim()
      : ""
  const zone = String(
    event.zone ||
      event.locationZone ||
      snakeZone ||
      ext.locationZone ||
      ext.location_zone ||
      ""
  ).trim()
  const myRole = String(ext.myRole || "").toUpperCase()
  const canManageMeetup =
    Boolean(ext.isAdmin) ||
    myRole === "ADMIN" ||
    myRole === "MODERATOR"
  const alreadyInEvent =
    Boolean(ext.isMember) ||
    myRole === "ADMIN" ||
    myRole === "MODERATOR" ||
    myRole === "GUEST" ||
    String(ext.creatorId || "") === (currentUserId ?? "__")
  const showJoinButton = !alreadyInEvent

  const creatorPhoto = String(
    event.creatorProfilePictureUrl || event.creatorPhotoUrl || ""
  ).trim()
  const creatorUsername = String(event.creatorUsername || "").trim()
  const creatorId = String(event.creatorId || "").trim()
  const openCreatorProfile = () => {
    if (creatorId) router.push(profileHref(creatorId, currentUserId))
  }

  const primaryLocation =
    officialAddress ||
    zone ||
    te("Ubicación por confirmar", "Location TBD")
  const normalizedAddr = officialAddress.toLowerCase().replace(/\s+/g, " ")
  const normalizedZone = zone.toLowerCase().replace(/\s+/g, " ")
  const secondaryLocation =
    officialAddress &&
    zone &&
    normalizedAddr !== normalizedZone
      ? zone
      : null

  const hasResolvedPlace = Boolean(officialAddress || zone)

  const dateLocale = localeCode.startsWith("es") ? es : enUS
  const startsFormatted =
    event.startsAt && !Number.isNaN(new Date(event.startsAt).getTime())
      ? format(new Date(event.startsAt), "EEEE · h:mm a", { locale: dateLocale })
      : te("Fecha por definir", "Date TBD")

  const maxG = event.maxGuests
  const current = Number(event.currentApprovedCount || 0)
  const joinedLine =
    maxG != null
      ? `${current}/${maxG}`
      : `${current}`

  const occupancyHint =
    maxG != null
      ? te(`👥 ${current}/${maxG} cupos`, `👥 ${current}/${maxG} spots`)
      : te("👥 Cupos ilimitados", "👥 Unlimited spots")

  const descriptionTrim = event._description?.trim()
  const quoteText = descriptionTrim
    ? descriptionTrim
    : te("Meetup grupal — únete y conoce gente nueva.", "Group meetup — join and meet new people.")

  const statusUpper = String(event.status || "OPEN").toUpperCase()
  const statusOpen = statusUpper === "OPEN"
  const statusLabel =
    statusUpper === "OPEN"
      ? te("Abierto", "Open")
      : statusUpper === "FULL"
        ? te("Lleno", "Full")
        : statusUpper === "CANCELLED"
          ? te("Cancelado", "Cancelled")
          : statusUpper === "FINISHED"
            ? te("Finalizado", "Finished")
            : statusUpper === "EXPIRED"
              ? te("Expirado", "Expired")
              : statusUpper

  const vibeTags: string[] = []
  const cat = event.category ? CATEGORY_VIBE[event.category] : null
  if (cat) vibeTags.push(te(cat.es, cat.en))
  if (event.free === true) vibeTags.push(te("🎟️ Gratis", "🎟️ Free"))
  if (event.free === false) vibeTags.push(te("💳 Pago", "💳 Paid"))
  if (vibeTags.length === 0)
    vibeTags.push(te("✨ Meetup", "✨ Meetup"))

  const interestedCount =
    typeof ext.interestedCount === "number"
      ? ext.interestedCount
      : typeof ext.waitlistCount === "number"
        ? ext.waitlistCount
        : null
  const viewingNow =
    typeof ext.liveViewerCount === "number"
      ? ext.liveViewerCount
      : typeof ext.viewerCount === "number"
        ? ext.viewerCount
        : null

  const isOwnMeetup =
    Boolean(currentUserId) &&
    Boolean(creatorId) &&
    creatorId === currentUserId

  const trendingOptOut = ext.trendingNearby === false
  const hasLiveViewers = viewingNow != null && viewingNow > 0
  const showTrendingFallback =
    !hasLiveViewers &&
    !isOwnMeetup &&
    !trendingOptOut

  type ActivityKind = "viewing" | "trending"
  let activityKind: ActivityKind | null = null
  let activityText: string | null = null
  if (hasLiveViewers && viewingNow != null) {
    activityKind = "viewing"
    activityText =
      viewingNow === 1
        ? te("🟢 1 viendo ahora", "🟢 1 viewing now")
        : te(`🟢 ${viewingNow} viendo ahora`, `🟢 ${viewingNow} viewing now`)
  } else if (showTrendingFallback) {
    activityKind = "trending"
    activityText = te("🔥 Trending cerca de ti", "🔥 Trending near you")
  }

  const showSocialStats =
    interestedCount != null && interestedCount > 0

  const coverUrl = (
    event.coverPhotoUrl ||
    event.coverPhoto ||
    ""
  ).trim()

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
          "hover:border-cyan-400/26 hover:shadow-[0_22px_56px_-18px_rgba(6,182,212,0.32),0_0_88px_-28px_rgba(16,185,129,0.24),inset_0_1px_0_rgba(255,255,255,0.09)]"
        )}
      >
        <div
          className="relative isolate min-h-[7.25rem] w-full overflow-hidden"
          style={{ backgroundImage: MEETUP_COVER_BACKGROUND }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_0%,rgba(167,243,208,0.16),transparent_50%)] opacity-95 mix-blend-screen"
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(255,255,255,0.12),transparent_58%)] mix-blend-soft-light"
            aria-hidden
            animate={{ opacity: [0.76, 0.92, 0.76] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="pointer-events-none absolute inset-0 shadow-[inset_0_-28px_44px_rgba(6,24,22,0.52),inset_0_0_72px_rgba(6,28,32,0.38)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-overlay [mask-image:radial-gradient(ellipse_at_center,black_42%,transparent_86%)]"
            style={{ backgroundImage: NOISE_DATA_URI }}
            aria-hidden
          />
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-[0.74] transition-opacity duration-500 ease-out group-hover/card:opacity-[0.84]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/94 via-emerald-950/44 to-emerald-950/12" />
            </>
          ) : null}
          <div className="relative flex min-h-[inherit] flex-col justify-between p-2.5 sm:p-3">
            <div className="flex flex-wrap items-start justify-between gap-1.5">
              <Badge className="gap-1 border border-white/18 bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-white shadow-[0_0_26px_-4px_rgba(52,211,153,0.48)] backdrop-blur-md">
                <Users className="size-3.5 shrink-0 text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.7)]" aria-hidden />
                {te("Meetup grupal", "Group meetup")}
              </Badge>
              <Badge
                className={cn(
                  "gap-1 border px-2 py-0.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm",
                  statusOpen
                    ? "border-orange-400/34 bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_6px_22px_-6px_rgba(249,115,22,0.55)]"
                    : "border-white/12 bg-muted-foreground/85"
                )}
              >
                {statusOpen ? (
                  <Flame className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <Zap className="size-3.5 shrink-0 opacity-90" aria-hidden />
                )}
                {statusLabel}
              </Badge>
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
                    "size-[4.125rem] cursor-pointer border-[3px] border-background shadow-[0_14px_42px_-12px_rgba(6,182,212,0.62),0_0_0_1px_rgba(255,255,255,0.14),inset_0_1px_0_rgba(255,255,255,0.22)] ring-[3px] ring-cyan-400/38 ring-offset-0 transition-shadow duration-500",
                    "group-hover/card:shadow-[0_18px_48px_-10px_rgba(16,185,129,0.52),0_0_52px_-16px_rgba(6,182,212,0.38)] group-hover/card:ring-emerald-300/48"
                  )}
                  onClick={creatorId ? openCreatorProfile : undefined}
                >
                  <AvatarImage src={creatorPhoto || undefined} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600/48 via-teal-600/36 to-cyan-500/28 text-lg font-bold text-white">
                    {creatorUsername?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                {statusOpen ? (
                  <span className="absolute bottom-1 right-1 flex size-3 items-center justify-center rounded-full bg-emerald-400 shadow-[0_0_0_2px_hsl(var(--card)),0_0_14px_rgba(52,211,153,0.85)] ring-2 ring-emerald-300/70">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/45 [animation-duration:2.2s]" aria-hidden />
                    <span className="relative size-1.5 rounded-full bg-emerald-100" aria-hidden />
                  </span>
                ) : null}
              </motion.div>
              <div className="min-w-0 flex-1 space-y-0.5 pt-8 sm:pt-9">
                <h3 className="line-clamp-2 text-[1.0625rem] font-bold leading-[1.28] tracking-[-0.02em] text-zinc-50 drop-shadow-[0_1px_18px_rgba(0,0,0,0.35)]">
                  {event._title}
                </h3>
                <p className="truncate text-[13px] leading-snug tracking-[-0.01em] text-zinc-400">
                  {creatorUsername ? (
                    <button
                      type="button"
                      onClick={openCreatorProfile}
                      disabled={!creatorId}
                      className="font-semibold text-emerald-400 underline-offset-2 transition-colors hover:text-cyan-300 hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-70"
                    >
                      @{creatorUsername}
                    </button>
                  ) : (
                    <span className="font-medium text-zinc-500">
                      {te("Organizador", "Host")}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-2 flex gap-2 rounded-[0.875rem] border border-white/[0.09] bg-white/[0.045] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md dark:bg-black/28">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.48)]" aria-hidden />
              <p className="line-clamp-3 text-[13px] italic leading-snug tracking-[-0.01em] text-zinc-100">
                &ldquo;{quoteText}&rdquo;
              </p>
            </div>
          </div>

          <div className={divider} />

          <div className="space-y-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5">
            <div className="space-y-1 text-[12px] pb-[5px] leading-snug tracking-[-0.01em] text-zinc-400">
              <div
                className={cn(
                  "flex items-start gap-2 rounded-[0.875rem] border px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md",
                  hasResolvedPlace
                    ? "border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.12] via-teal-500/[0.06] to-transparent"
                    : "border-white/[0.08] bg-white/[0.03]"
                )}
              >
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-emerald-300 drop-shadow-[0_0_14px_rgba(52,211,153,0.45)]"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.11em] text-emerald-100/85">
                    {te("Ubicación", "Location")}
                  </span>
                  <span className="block text-[13px] font-bold leading-snug tracking-[-0.015em] text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)]">
                    {primaryLocation}
                  </span>
                  {secondaryLocation ? (
                    <span className="block text-[11px] font-semibold leading-snug text-zinc-300">
                      {secondaryLocation}
                    </span>
                  ) : null}
                </span>
              </div>
              <span className="flex items-center gap-2">
                <Calendar className="size-3.5 shrink-0 text-cyan-400/95" aria-hidden />
                <span className="capitalize">{startsFormatted}</span>
              </span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Users className="size-3.5 shrink-0 text-teal-400/95" aria-hidden />
                <span className="tabular-nums font-bold text-zinc-100">{joinedLine}</span>
                <span className="font-semibold text-zinc-500">
                  · {te("unidos", "joined")}
                </span>
                <span className="text-zinc-500">
                  ·{" "}
                  {event.maxGuests
                    ? te(`${available} libres`, `${available} left`)
                    : te("ilimitado", "open")}
                </span>
              </span>
              <p className="text-[11.5px] font-bold text-zinc-300">{occupancyHint}</p>
            </div>

            {(activityText || vibeTags.length > 0) ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {activityText ? (
                  <div
                    role="status"
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[11.5px] font-bold leading-snug tracking-[-0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-colors duration-300",
                      activityKind === "viewing"
                        ? "border-emerald-400/28 bg-gradient-to-r from-emerald-500/[0.14] to-teal-500/[0.1] text-emerald-50"
                        : "border-orange-400/32 bg-gradient-to-r from-orange-500/16 via-amber-500/12 to-rose-500/10 text-zinc-100"
                    )}
                  >
                    {activityKind === "viewing" ? (
                      <span
                        className="inline-flex size-2 shrink-0 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_14px_rgba(52,211,153,0.88)]"
                        aria-hidden
                      />
                    ) : null}
                    <span className="whitespace-nowrap">{activityText}</span>
                  </div>
                ) : null}
                {vibeTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex shrink-0 rounded-full border border-white/[0.1] bg-white/[0.055] px-2 py-0.5 text-[11px] font-semibold tracking-[-0.01em] text-zinc-100 shadow-[0_2px_12px_-6px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.095] hover:shadow-[0_4px_16px_-8px_rgba(6,182,212,0.28)] active:scale-[0.97]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {showSocialStats ? (
            <>
              <div className={divider} />
              <div className="px-3 py-1.5 sm:px-3.5">
                {interestedCount != null && interestedCount > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-[0.875rem] border border-white/[0.07] bg-white/[0.035] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md dark:bg-black/26">
                    <div className="flex -space-x-2 ps-0.5" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-zinc-600/90 to-zinc-800/80 shadow-[0_6px_16px_-6px_rgba(6,182,212,0.38)]"
                        >
                          <Users className="size-3 text-zinc-300/90" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[12px] font-bold tracking-[-0.015em] text-zinc-100">
                      👤👤👤 +{interestedCount}{" "}
                      {te("interesados", "interested")}
                    </span>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <div className={divider} />
          <div className="flex flex-col gap-1.5 p-3 pb-3.5 sm:flex-row sm:items-stretch sm:p-3.5">
            {showJoinButton ? (
              <motion.div className="order-1 flex-1 sm:order-2" whileTap={{ scale: 0.985 }} transition={{ duration: 0.15 }}>
                <Button
                  type="button"
                  className="h-10 w-full rounded-[0.875rem] border-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 font-bold text-black shadow-[0_8px_32px_-10px_rgba(16,185,129,0.62),0_0_52px_-14px_rgba(6,182,212,0.42)] transition-[filter,box-shadow] duration-300 ease-out hover:brightness-[1.08] hover:shadow-[0_12px_40px_-10px_rgba(16,185,129,0.72),0_0_60px_-12px_rgba(6,182,212,0.48)] active:brightness-95"
                  onClick={() => onJoin(event._id, event.maxGuests != null ? available : null)}
                  disabled={joiningEventId === event._id}
                >
                  {joiningEventId === event._id
                    ? te("Uniendo...", "Joining...")
                    : te("Unirme ahora", "Join now")}
                </Button>
              </motion.div>
            ) : null}
            <motion.div className={cn("flex-1", showJoinButton ? "order-2 sm:order-1" : "")} whileTap={{ scale: 0.985 }} transition={{ duration: 0.15 }}>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-[0.875rem] border-white/[0.11] bg-white/[0.035] font-semibold text-zinc-100 shadow-none backdrop-blur-lg transition-all duration-300 ease-out hover:border-white/[0.18] hover:bg-white/[0.09] hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                onClick={() => router.push(`/events/${event._id}`)}
              >
                {te("Ver detalle", "View details")}
              </Button>
            </motion.div>
            {canManageMeetup ? (
              <motion.div className="order-3 flex-1 sm:flex-none sm:min-w-[7.5rem]" whileTap={{ scale: 0.985 }} transition={{ duration: 0.15 }}>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 w-full rounded-[0.875rem] border border-white/[0.09] bg-white/[0.045] font-semibold text-zinc-100 backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:bg-white/[0.09]"
                  onClick={() => router.push(`/events/${event._id}?tab=settings`)}
                >
                  {te("Configurar", "Configure")}
                </Button>
              </motion.div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
