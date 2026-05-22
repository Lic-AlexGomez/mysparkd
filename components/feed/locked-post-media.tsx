"use client"

import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

type Props = {
  uri?: string | null
  isVideo?: boolean
  compact?: boolean
  onClick: () => void
}

function PlaceholderPreview() {
  const bars = ["92%", "78%", "85%", "60%", "88%"] as const
  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-[#1a2744] via-[#2d1f4e] to-[#0f3460]"
      aria-hidden
    >
      <div className="flex h-full flex-col justify-center gap-2.5 p-6">
        {bars.map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-md bg-white/20"
            style={{ width: w, opacity: 0.35 + (i % 3) * 0.12 }}
          />
        ))}
        <div className="mt-2 h-28 rounded-xl bg-white/10" />
      </div>
    </div>
  )
}

function LockOverlay() {
  const { te } = useI18n()
  return (
    <>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50">
          <Lock className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm font-semibold text-white">
          {te("Contenido Premium", "Premium content")}
        </p>
        <span className="rounded-full border border-white/50 px-4 py-1.5 text-xs text-white transition-colors hover:bg-white/20">
          {te("Toca para desbloquear", "Tap to unlock")}
        </span>
      </div>
    </>
  )
}

export function LockedPostMedia({ uri, isVideo, compact, onClick }: Props) {
  const hasMedia = Boolean(uri?.trim())
  const heightClass = compact ? "max-h-52" : "max-h-96"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick()
      }}
      className={cn(
        "relative mt-3 cursor-pointer overflow-hidden rounded-xl bg-muted",
        heightClass,
        "min-h-[200px]"
      )}
    >
      {hasMedia ? (
        isVideo ? (
          <video
            src={uri!}
            className="h-full w-full object-cover blur-xl brightness-50 scale-105 select-none pointer-events-none"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={uri!}
            alt=""
            className="h-full w-full object-cover blur-xl brightness-50 scale-105 select-none pointer-events-none"
          />
        )
      ) : (
        <PlaceholderPreview />
      )}
      <LockOverlay />
    </div>
  )
}
