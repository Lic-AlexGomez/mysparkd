"use client"

import { motion } from "framer-motion"
import { SparkyCharacterWeb } from "@/components/sparky/SparkyCharacterWeb"
import type { CompanionId } from "@/lib/companion/catalog"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import { cn } from "@/lib/utils"

type SparkyRinconSceneWebProps = {
  expression: SparkyExpression
  companionId: CompanionId
  avatarStyle?: string | null
  wardrobeAccessory?: string | null
  gaze: SparkyGaze
  speaking?: boolean
  isSleepy?: boolean
  isHappy?: boolean
  className?: string
}

const STARS = [
  { top: "14%", left: "12%", size: 2, opacity: 0.5 },
  { top: "22%", left: "78%", size: 2.5, opacity: 0.65 },
  { top: "8%", left: "55%", size: 1.5, opacity: 0.4 },
  { top: "18%", left: "38%", size: 2, opacity: 0.55 },
  { top: "10%", left: "88%", size: 2, opacity: 0.45 },
] as const

/** Escena premium del rinconcito — ventana nocturna, pedestal y glow (paridad con app móvil). */
export function SparkyRinconSceneWeb({
  expression,
  companionId,
  avatarStyle,
  wardrobeAccessory,
  gaze,
  speaking = false,
  isSleepy = false,
  isHappy = false,
  className,
}: SparkyRinconSceneWebProps) {
  return (
    <div
      className={cn(
        "relative mx-2 mt-1 h-[210px] overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-b from-cyan-500/10 via-fuchsia-500/5 to-card/40",
        className
      )}
    >
      {/* Ventana nocturna */}
      <div className="absolute right-4 top-3 h-16 w-[88px] overflow-hidden rounded-xl border border-cyan-300/25">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-cyan-900/40" />
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-amber-100/90"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            }}
          />
        ))}
        <span className="absolute right-3 top-2.5 h-3.5 w-3.5 rounded-full bg-amber-100/70" />
      </div>

      {/* Alfombra */}
      <div className="absolute inset-x-4 bottom-3 h-[52px] overflow-hidden rounded-t-[28px] bg-fuchsia-400/10">
        <div className="absolute inset-x-[20%] top-0 h-3 rounded-full bg-cyan-300/15 blur-sm" />
      </div>

      {/* Cojín / nido */}
      <div
        className={cn(
          "absolute bottom-7 left-5 h-[22px] w-[52px] rounded-lg bg-violet-400/25 transition-transform",
          isSleepy && "scale-y-110"
        )}
      />

      {/* Lámpara */}
      <div className="absolute bottom-[72px] left-6 flex flex-col items-center">
        <motion.span
          className="h-7 w-[3px] rounded-full bg-cyan-300/40"
          animate={{ opacity: isHappy ? [0.5, 1, 0.5] : [0.35, 0.7, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="-mt-0.5 h-3 w-3 rounded-full bg-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.65)]"
          animate={{ opacity: isHappy ? [0.7, 1, 0.7] : [0.45, 0.85, 0.45] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Pedestal + Sparky */}
      <div className="absolute bottom-6 left-1/2 flex h-[132px] w-[132px] -translate-x-1/2 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/10">
        <motion.div
          className="absolute inset-2 rounded-full border border-dashed border-cyan-200/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-3 rounded-full bg-cyan-300/20 blur-xl"
          animate={{ opacity: speaking ? [0.35, 0.7, 0.35] : [0.25, 0.5, 0.25] }}
          transition={{ duration: speaking ? 1.1 : 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relative z-[2]"
          animate={{ y: speaking ? [0, -5, 0] : [0, -8, 0] }}
          transition={{ duration: speaking ? 1.1 : 2.7, repeat: Infinity, ease: "easeInOut" }}
        >
          <SparkyCharacterWeb
            expression={expression}
            companionId={companionId}
            avatarStyle={avatarStyle}
            wardrobeAccessory={wardrobeAccessory}
            size={136}
            gaze={gaze}
          />
        </motion.div>
      </div>
    </div>
  )
}
