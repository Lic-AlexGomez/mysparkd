"use client"

import { useState } from "react"
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { reputationService } from "@/lib/services/reputation"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { VoiceNotePlayer } from "@/components/ui/voice-note"

interface SwipeCardProps {
  user: {
    userId: string
    nombres: string
    apellidos: string
    photos: { url: string; isPrimary: boolean }[]
    reputation?: number
    interests?: string[]
    bio?: string
    location?: string
    dateOfBirth?: string
    voiceNoteUrl?: string
  }
  onSwipe: (direction: "left" | "right") => void
  isTop: boolean
  compatibility?: number
}

function getAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null
  const diff = Date.now() - new Date(dateOfBirth).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export function SwipeCard({ user, onSwipe, isTop, compatibility }: SwipeCardProps) {
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

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (showInfo) return
    if (info.offset.x > 100) onSwipe("right")
    else if (info.offset.x < -100) onSwipe("left")
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      style={{ x, rotate, scale: cardScale, zIndex: isTop ? 10 : 0 }}
      drag={isTop && !showInfo ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      animate={isTop ? {} : { scale: 0.93, y: 14 }}
      exit={{ x: 600, opacity: 0, transition: { duration: 0.2 } }}
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

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          {compatibility && compatibility > 0 && (
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-white">{compatibility}% match</span>
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
                <Link
                  href={`/profile/${user.userId}${compatibility ? `?compatibility=${compatibility}` : ''}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="text-3xl font-black text-white tracking-tight hover:underline"
                >
                  {user.nombres}
                  {age && <span className="ml-2 text-2xl font-light text-white/80">{age}</span>}
                </Link>
                {user.location && (
                  <p className="text-xs text-white/60 mt-0.5">📍 {user.location}</p>
                )}
              </div>
              {isTop && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo) }}
                  className="flex-shrink-0 h-9 w-9 rounded-full shadow-lg flex items-center justify-center"
                >
                  {showInfo ? <span className="text-lg font-bold text-white">⇓</span> : <span className="text-lg font-bold text-white">⇑</span>}
                </button>
              )}
            </div>

            {/* Interests (siempre visibles) */}
            {user.interests && user.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.interests.slice(0, showInfo ? 10 : 3).map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-xs text-white font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* Extra info */}
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 space-y-3"
              >
                {user.bio && (
                  <div>
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Sobre mí</p>
                    <p className="text-sm text-white/90 leading-relaxed">{user.bio}</p>
                  </div>
                )}
                {user.voiceNoteUrl && (
                  <div>
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Nota de voz</p>
                    <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                      <VoiceNotePlayer url={user.voiceNoteUrl} />
                    </div>
                  </div>
                )}
                {!user.bio && !user.location && (
                  <p className="text-sm text-white/50 italic">Este usuario no ha completado su perfil aún.</p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
