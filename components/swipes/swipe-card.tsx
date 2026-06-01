"use client"

import { useState } from "react"
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { reputationService } from "@/lib/services/reputation"
import { VoiceNotePlayer } from "@/components/ui/voice-note"
import type { Interest, Photo } from "@/lib/types"
import { useI18n } from "@/lib/i18n"
import { getDatingDisplayName } from "@/lib/dm-eligibility"

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconChevronUp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="m18 15-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMapPin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 22s7-5.7 7-12a7 7 0 1 0-14 0c0 6.3 7 12 7 12Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
    </svg>
  )
}

function IconCake({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 11h14v8H5z" stroke="currentColor" strokeWidth="2" />
      <path d="M3 11h18M8 7v2m4-2v2m4-2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconFileText({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 3v5h5M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

interface SwipeCardProps {
  user: {
    userId: string
    nombres: string
    apellidos: string
    photos: Photo[]
    reputation?: number
    interests?: Array<string | Interest>
    bio?: string
    location?: string
    dateOfBirth?: string
    voiceNoteUrl?: string
    totalPosts?: number
    premium?: boolean
  }
  onSwipe: (direction: "left" | "right") => void
  isTop: boolean
  compatibility?: number
  exitDirection?: "left" | "right" | null
  /** false: sin arrastre ni swipe (límite alcanzado, etc.) */
  swipeEnabled?: boolean
}

function normalizeInterestLabel(interest: string | Interest): string {
  if (typeof interest === "string") return interest
  return interest?.name || interest?.interestId || ""
}

function getAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null
  const diff = Date.now() - new Date(dateOfBirth).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function getCompatibilityTheme(score: number, t: (key: string) => string) {
  if (score >= 80) {
    return {
      ring: "rgba(52,211,153,0.95)",
      glow: "rgba(16,185,129,0.35)",
      badge: "text-emerald-100 border-emerald-300/30 bg-emerald-500/20",
      label: t("swipeCard.compatVeryHigh"),
    }
  }
  if (score >= 60) {
    return {
      ring: "rgba(56,189,248,0.95)",
      glow: "rgba(14,165,233,0.35)",
      badge: "text-sky-100 border-sky-300/30 bg-sky-500/20",
      label: t("swipeCard.compatHigh"),
    }
  }
  if (score >= 40) {
    return {
      ring: "rgba(250,204,21,0.95)",
      glow: "rgba(234,179,8,0.3)",
      badge: "text-yellow-100 border-yellow-300/30 bg-yellow-500/20",
      label: t("swipeCard.compatMedium"),
    }
  }
  return {
    ring: "rgba(248,113,113,0.95)",
    glow: "rgba(239,68,68,0.3)",
    badge: "text-rose-100 border-rose-300/30 bg-rose-500/20",
    label: t("swipeCard.compatLow"),
  }
}

function getVibe(user: SwipeCardProps["user"], t: (key: string) => string) {
  const interestCount = user.interests?.length ?? 0
  if (user.premium && interestCount >= 5) return t("swipeCard.vibeTopProfile")
  if (interestCount >= 6) return t("swipeCard.vibeVerySocial")
  if (interestCount >= 3) return t("swipeCard.vibeInteresting")
  if ((user.bio || "").length >= 50) return t("swipeCard.vibeTalkative")
  return t("swipeCard.vibeUnknown")
}

export function SwipeCard({ user, onSwipe, isTop, compatibility, exitDirection, swipeEnabled = true }: SwipeCardProps) {
  const { t } = useI18n()
  const [showInfo, setShowInfo] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const likeOpacity = useTransform(x, [20, 120], [0, 1])
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0])
  const cardScale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95])

  const primaryPhoto = user.photos?.find((p) => p.isPrimary || (p as any).primary) || user.photos?.[0]
  const reputation = user.reputation || 75
  const reputationColor = reputationService.getReputationColor(reputation)
  const age = getAge(user.dateOfBirth)
  const displayName = getDatingDisplayName(user.nombres, "Usuario")
  const shortBio = (user.bio || "").trim()
  const safeCompatibility = Math.max(0, Math.min(100, compatibility || 0))
  const compatibilityTheme = getCompatibilityTheme(safeCompatibility, t)
  const vibe = getVibe(user, t)

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!swipeEnabled || showInfo) return
    if (info.offset.x > 100) onSwipe("right")
    else if (info.offset.x < -100) onSwipe("left")
  }

  return (
    <motion.div
      className={`absolute inset-0 select-none ${
        isTop ? (swipeEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-default") : "pointer-events-none"
      }`}
      style={{ x, rotate, scale: cardScale, zIndex: isTop ? 10 : 0 }}
      drag={isTop && swipeEnabled && !showInfo ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      animate={isTop ? {} : { scale: 0.93, y: 14 }}
      exit={isTop ? {
        x: exitDirection === "left" ? -520 : 520,
        rotate: exitDirection === "left" ? -16 : 16,
        opacity: 0,
        transition: { duration: 0.2 },
      } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-2xl bg-card">
        {/* Photo */}
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={user.nombres}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <Avatar className="h-32 w-32">
              <AvatarFallback className="bg-primary/20 text-primary text-5xl font-bold">
                {user.nombres?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {safeCompatibility > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(80% 55% at 50% 105%, ${compatibilityTheme.glow} 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          {safeCompatibility > 0 && (
            <div className="flex items-center gap-2">
                <div
                  className="relative grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/45 shadow-lg backdrop-blur-md"
                style={{
                  backgroundImage: `conic-gradient(${compatibilityTheme.ring} ${safeCompatibility * 3.6}deg, rgba(255,255,255,0.18) ${safeCompatibility * 3.6}deg 360deg)`,
                }}
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-black/75 text-[11px] font-black text-white">
                  {safeCompatibility}
                </div>
              </div>
              <div className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${compatibilityTheme.badge}`}>
                {compatibilityTheme.label} · {t("swipeCard.matchWord")}
              </div>
            </div>
          )}
          <div
            className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-black"
            style={{ backgroundColor: reputationColor }}
          >
            ★ {reputation}
          </div>
        </div>

        {/* LIKE overlay */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            opacity: likeOpacity,
            background: "linear-gradient(135deg, rgba(34,197,94,0.3) 0%, transparent 60%)",
          }}
        >
          <div className="absolute top-10 left-6 rotate-[-20deg] rounded-xl border-4 border-green-400 px-5 py-2">
            <span className="text-3xl font-black text-green-400 drop-shadow-lg">LIKE</span>
          </div>
        </motion.div>

        {/* NOPE overlay */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            opacity: nopeOpacity,
            background: "linear-gradient(225deg, rgba(239,68,68,0.3) 0%, transparent 60%)",
          }}
        >
          <div className="absolute top-10 right-6 rotate-[20deg] rounded-xl border-4 border-red-400 px-5 py-2">
            <span className="text-3xl font-black text-red-400 drop-shadow-lg">NOPE</span>
          </div>
        </motion.div>


        {/* Info panel */}
        <motion.div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/95 to-transparent rounded-b-3xl"
          animate={{ height: showInfo ? "75%" : "auto" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="p-5">
            {/* Name + info button */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white tracking-tight">
                  {displayName}
                  {age != null && (
                    <span className="ml-2 text-2xl font-light text-white/80">{age}</span>
                  )}
                </p>
              </div>
              {isTop && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo) }}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/35 shadow-lg backdrop-blur-sm transition-colors hover:bg-black/50"
                  aria-label={showInfo ? t("swipeCard.hideDetails") : t("swipeCard.seeMoreDetails")}
                >
                  {showInfo ? <IconChevronDown className="h-4.5 w-4.5 text-white" /> : <IconChevronUp className="h-4.5 w-4.5 text-white" />}
                </button>
              )}
            </div>

            {/* Info rápida visible siempre */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user.location && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur-sm">
                  <IconMapPin className="h-3 w-3" /> {user.location}
                </span>
              )}
              {age && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur-sm">
                  <IconCake className="h-3 w-3" /> {age} {t("swipeCard.yearsOld")}
                </span>
              )}
              {typeof user.totalPosts === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur-sm">
                  <IconFileText className="h-3 w-3" /> {user.totalPosts} posts
                </span>
              )}
              {user.premium && (
                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/30 bg-yellow-400/20 px-2 py-0.5 text-[11px] font-semibold text-yellow-100 backdrop-blur-sm">
                  ✨ {t("swipeCard.premium")}
                </span>
              )}
            </div>

            {/* Mini tarjeta de personalidad */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-white/15 bg-black/30 p-2.5 backdrop-blur-sm">
              <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-white/50">{t("swipeCard.vibe")}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white">{vibe}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-white/50">{t("swipeCard.reputation")}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white">{reputation}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-white/50">Match</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white">{safeCompatibility || "—"}%</p>
              </div>
            </div>

            {/* Interests (siempre visibles) */}
            {user.interests && user.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.interests.slice(0, showInfo ? 10 : 5).map((interest, idx) => (
                  <span
                    key={`${normalizeInterestLabel(interest)}-${idx}`}
                    className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-xs text-white font-medium"
                  >
                    {normalizeInterestLabel(interest)}
                  </span>
                ))}
              </div>
            )}

            {/* Bio corta siempre visible */}
            {shortBio && (
              <p className={`mt-3 text-sm leading-relaxed text-white/90 ${showInfo ? "" : "line-clamp-2"}`}>
                {shortBio}
              </p>
            )}

            {/* Extra info */}
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 space-y-3"
              >
                {user.voiceNoteUrl && (
                  <div>
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">{t("swipeCard.voiceNote")}</p>
                    <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                      <VoiceNotePlayer url={user.voiceNoteUrl} />
                    </div>
                  </div>
                )}
                <p className="text-xs text-white/50 italic">
                  {t("swipeCard.datingProfileOnly")}
                </p>
                {!user.bio && !user.location && (
                  <p className="text-sm text-white/50 italic">{t("swipeCard.incompleteProfile")}</p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
