"use client"

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SwipeCardProps {
  user: {
    userId: string
    nombres: string
    apellidos: string
    photos: { url: string; isPrimary: boolean }[]
  }
  onSwipe: (direction: "left" | "right") => void
  isTop: boolean
}

export function SwipeCard({ user, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  const primaryPhoto = user.photos?.find((p) => p.isPrimary) || user.photos?.[0]

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      onSwipe("right")
    } else if (info.offset.x < -threshold) {
      onSwipe("left")
    }
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={isTop ? {} : { scale: 0.95, y: 10 }}
      exit={{ x: 500, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-card shadow-xl">
        {/* Photo */}
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={`${user.nombres} ${user.apellidos}`}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Avatar className="h-32 w-32">
              <AvatarFallback className="bg-primary/20 text-primary text-4xl">
                {user.nombres?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* LIKE overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-success/20"
          style={{ opacity: likeOpacity }}
        >
          <span className="rounded-lg border-4 border-success px-6 py-2 text-4xl font-black text-success -rotate-12">
            LIKE
          </span>
        </motion.div>

        {/* NOPE overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-destructive/20"
          style={{ opacity: nopeOpacity }}
        >
          <span className="rounded-lg border-4 border-destructive px-6 py-2 text-4xl font-black text-destructive rotate-12">
            NOPE
          </span>
        </motion.div>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">
            {user.nombres} {user.apellidos}
          </h2>
        </div>
      </div>
    </motion.div>
  )
}
