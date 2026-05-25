"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { SparkyAnimMode, SparkyFacing } from "@/lib/sparky-web-presence"

type Props = {
  expression?: SparkyExpression
  size?: number
  facing?: SparkyFacing
  animMode?: SparkyAnimMode
  blinking?: boolean
  winking?: boolean
  speaking?: boolean
  className?: string
}

export function SparkyRobot({
  expression = "idle",
  size = 64,
  facing = "center",
  animMode = "float",
  blinking = false,
  winking = false,
  speaking = false,
  className,
}: Props) {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (blinking) {
      setBlink(true)
      const t = setTimeout(() => setBlink(false), 120)
      return () => clearTimeout(t)
    }
  }, [blinking])

  const isSleep = animMode === "sleep" || expression === "sleepy"
  const isThink = animMode === "think" || expression === "thinking"
  const isHappy = expression === "happy" || expression === "celebrating" || expression === "excited"
  const isWink = winking || expression === "wink"
  const mouthOpen = speaking || expression === "speaking" || expression === "excited"

  const tilt = facing === "left" ? -8 : facing === "right" ? 8 : 0

  const floatY =
    animMode === "bounce"
      ? [0, -14, 0]
      : animMode === "celebrate"
        ? [0, -10, -4, -12, 0]
        : animMode === "sleep"
          ? [0, -2, 0]
          : [0, -5, 0]

  const eyeScaleL = isWink ? 0.15 : isSleep ? 0.35 : blink ? 0.08 : 1
  const eyeScaleR = isSleep ? 0.35 : blink ? 0.08 : 1

  return (
    <motion.div
      className={cn("relative select-none", className)}
      style={{ width: size, height: size + 8 }}
      animate={{
        y: floatY,
        rotate: tilt,
        scale: animMode === "bounce" ? [1, 1.08, 1] : animMode === "celebrate" ? [1, 1.05, 1] : 1,
      }}
      transition={{
        y: { duration: animMode === "celebrate" ? 0.6 : 2.4, repeat: Infinity, ease: "easeInOut" },
        rotate: { type: "spring", stiffness: 200, damping: 18 },
        scale: { duration: 0.45 },
      }}
    >
      {/* Sombra base — se mueve con el float */}
      <motion.div
        className="absolute bottom-0 left-1/2 h-2 w-[55%] -translate-x-1/2 rounded-[100%] bg-black/40 blur-sm"
        animate={{ scaleX: [1, 0.85, 1], opacity: [0.35, 0.25, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />

      <svg
        viewBox="0 0 100 110"
        width={size}
        height={size * 1.08}
        className="relative z-[1] drop-shadow-[0_0_12px_rgba(0,229,255,0.45)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="sparkyBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1f2e" />
            <stop offset="50%" stopColor="#0f1219" />
            <stop offset="100%" stopColor="#1e2433" />
          </linearGradient>
          <linearGradient id="sparkyFlame" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Antena / chispa superior */}
        <ellipse cx="50" cy="12" rx="8" ry="10" fill="url(#sparkyFlame)" filter="url(#glow)" className="opacity-90" />

        {/* Cuerpo tipo Eilik — domo compacto */}
        <path
          d="M50 22 C68 22 82 38 84 58 C86 78 72 92 50 94 C28 92 14 78 16 58 C18 38 32 22 50 22 Z"
          fill="url(#sparkyBody)"
          stroke="rgba(0,229,255,0.45)"
          strokeWidth="1.5"
        />

        {/* Panel frontal */}
        <ellipse cx="50" cy="58" rx="28" ry="24" fill="rgba(0,229,255,0.06)" stroke="rgba(0,229,255,0.15)" />

        {/* Ojos OLED */}
        <g transform="translate(0, 4)">
          <rect x="32" y="48" width="14" height="16" rx="7" fill="#0a0b0f" stroke="rgba(0,229,255,0.3)" />
          <rect x="54" y="48" width="14" height="16" rx="7" fill="#0a0b0f" stroke="rgba(0,229,255,0.3)" />

          <motion.ellipse
            cx="39"
            cy={isThink ? 52 : 56}
            rx="4"
            ry={isThink ? 3 : 5}
            fill="#00e5ff"
            animate={{ scaleY: eyeScaleL }}
            transition={{ duration: 0.08 }}
          />
          <motion.ellipse
            cx="61"
            cy={isThink ? 52 : 56}
            rx="4"
            ry={isThink ? 3 : 5}
            fill="#00e5ff"
            animate={{ scaleY: eyeScaleR }}
            transition={{ duration: 0.08 }}
          />

          {/* Brillo ojos */}
          <circle cx="37" cy="54" r="1.5" fill="white" opacity={isSleep ? 0.2 : 0.9} />
          <circle cx="59" cy="54" r="1.5" fill="white" opacity={isSleep ? 0.2 : 0.9} />
        </g>

        {/* Mejillas */}
        {(isHappy || animMode === "celebrate") && (
          <>
            <ellipse cx="26" cy="62" rx="5" ry="3" fill="rgba(217,70,239,0.35)" />
            <ellipse cx="74" cy="62" rx="5" ry="3" fill="rgba(217,70,239,0.35)" />
          </>
        )}

        {/* Boca */}
        {mouthOpen ? (
          <ellipse cx="50" cy="72" rx="8" ry="5" fill="#0a0b0f" stroke="#00e5ff" strokeWidth="1" />
        ) : isSleep ? (
          <path d="M44 72 Q50 74 56 72" stroke="#00e5ff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M44 70 Q50 74 56 70" stroke="#00e5ff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}

        {/* LED estado */}
        <motion.circle
          cx="50"
          cy="88"
          r="3"
          fill={isThink ? "#f59e0b" : isHappy ? "#10b981" : "#00e5ff"}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </svg>

      <motion.div
        className="pointer-events-none absolute left-1/2 top-0 h-5 w-4 -translate-x-1/2 rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-500 opacity-80 blur-[2px]"
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />

      {/* Partículas ocasionales */}
      {animMode === "celebrate" && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute text-[10px]"
              style={{ left: "50%", top: 0 }}
              initial={{ opacity: 0, y: 0, x: (i - 1) * 12 }}
              animate={{ opacity: [0, 1, 0], y: -20, x: (i - 1) * 20 }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            >
              ✦
            </motion.span>
          ))}
        </>
      )}
    </motion.div>
  )
}
