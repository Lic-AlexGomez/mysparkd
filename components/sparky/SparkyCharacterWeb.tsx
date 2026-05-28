"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { CompanionId } from "@/lib/companion/catalog"
import { getCompanionSkin } from "@/lib/companion/companion-skin"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"

type SparkyCharacterWebProps = {
  expression?: SparkyExpression
  companionId?: CompanionId
  wardrobeAccessory?: string | null
  size?: number
  className?: string
  gaze?: SparkyGaze
}

const MOOD_MODIFIER: Record<SparkyExpression, string> = {
  idle: "",
  happy: "brightness-110",
  wink: "",
  sleepy: "opacity-80",
  thinking: "hue-rotate-15",
  excited: "brightness-125 saturate-150",
  celebrating: "brightness-125",
  speaking: "",
  confused: "hue-rotate-30",
  sad: "opacity-75 saturate-50",
  scared: "hue-rotate-90 contrast-125",
}

export function SparkyCharacterWeb({
  expression = "idle",
  companionId = "sparky",
  wardrobeAccessory = null,
  size = 48,
  className = "",
  gaze = { x: 0, y: 0 },
}: SparkyCharacterWebProps) {
  const reduceMotion = useReducedMotion()
  const [blink, setBlink] = useState(false)
  const [imperfection, setImperfection] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const skin = getCompanionSkin(companionId)
  const modifier = MOOD_MODIFIER[expression] ?? ""

  const isThinking = expression === "thinking" || expression === "confused"
  const isExcited = expression === "excited" || expression === "celebrating"
  const isScared = expression === "scared"

  useEffect(() => {
    if (reduceMotion) return
    let cancelled = false
    let timeoutId = 0
    const loop = () => {
      if (cancelled) return
      timeoutId = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 100)
        loop()
      }, 2000 + Math.random() * 3000)
    }
    loop()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [reduceMotion])

  useEffect(() => {
    if (reduceMotion) return
    let cancelled = false
    let id = 0
    const loop = () => {
      if (cancelled) return
      const expressiveIdle =
        expression === "idle" || expression === "thinking" || expression === "sleepy"
      setImperfection(
        expressiveIdle
          ? { x: (Math.random() - 0.5) * 0.22, y: (Math.random() - 0.5) * 0.16 }
          : { x: 0, y: 0 }
      )
      id = window.setTimeout(loop, 2200 + Math.random() * 2600)
    }
    loop()
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [reduceMotion, expression])

  const eyeScaleY = useMemo(() => {
    if (expression === "sleepy" || expression === "sad") return 0.32
    if (expression === "wink") return 0.18
    if (blink) return 0.06
    return 1
  }, [blink, expression])

  const eyeW = size * 0.14
  const eyeH = size * (isScared || isExcited ? 0.13 : 0.11)
  const pupilBase = eyeW * (isScared ? 0.3 : isExcited ? 0.52 : 0.42)
  const gazeX = expression === "speaking" ? gaze.x : gaze.x + imperfection.x
  const gazeY = expression === "speaking" ? gaze.y : gaze.y + imperfection.y
  const pupilX = (isThinking ? 0 : gazeX) * eyeW * 0.26
  const pupilY = (isThinking ? -eyeH * 0.55 : gazeY * eyeH * 0.24)

  const shape =
    companionId === "slime"
      ? "rounded-[40%]"
      : companionId === "pixel_cat"
        ? "rounded-md"
        : companionId === "ghost"
          ? "rounded-full opacity-90"
          : "rounded-full"

  const tilt = (isThinking ? 0 : gaze.x) * 6

  return (
    <motion.div
      className={`relative flex items-center justify-center ${className} ${modifier}`}
      style={{ width: size, height: size }}
      animate={
        reduceMotion
          ? undefined
          : {
              y: [0, -5, 0],
              scale: [1, 1.05, 1.02, 1],
              rotate: [tilt - 2, tilt + 2, tilt],
            }
      }
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <motion.div
        className={`absolute inset-0 ${shape}`}
        style={{
          background: `linear-gradient(135deg, ${skin.primary}, ${skin.secondary}, ${skin.accent})`,
          boxShadow: `0 0 ${size * 0.4}px ${skin.accent}66`,
        }}
        animate={reduceMotion ? undefined : { opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.8, repeat: Infinity }}
      />
      {wardrobeAccessory ? (
        <div
          className="absolute left-1/2 z-10 -translate-x-1/2 rounded-sm"
          style={{
            top: wardrobeAccessory === "wardrobe_crown" ? -2 : 4,
            width: size * 0.45,
            height: size * 0.12,
            backgroundColor: skin.accent,
          }}
        />
      ) : null}
      <div className="relative flex gap-1.5" style={{ marginTop: size * 0.1 }}>
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="relative flex items-center justify-center overflow-hidden rounded-full bg-white"
            style={{ width: eyeW, height: eyeH }}
            animate={{ scaleY: i === 1 && expression === "wink" ? 1 : eyeScaleY }}
            transition={{ duration: 0.07 }}
          >
            <motion.span
              className="absolute rounded-full bg-foreground"
              style={{ width: pupilBase, height: pupilBase }}
              animate={{ x: (i === 0 ? -1 : 1) * pupilX, y: pupilY, scale: isExcited ? 1.12 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            <span
              className="absolute rounded-full bg-white/90"
              style={{ width: pupilBase * 0.35, height: pupilBase * 0.35, top: 2, right: 3 }}
            />
          </motion.div>
        ))}
      </div>
      <motion.span
        className="absolute bg-foreground/90"
        style={{
          width: size * (isScared ? 0.1 : isExcited ? 0.18 : 0.14),
          height: size * (isExcited ? 0.08 : 0.05),
          bottom: size * 0.2,
          borderRadius: isScared ? 999 : "0 0 999px 999px",
        }}
        animate={
          expression === "speaking" || expression === "excited" || expression === "thinking"
            ? { scaleY: [1, 1.35, 1] }
            : undefined
        }
        transition={{ duration: 0.22, repeat: Infinity }}
      />
    </motion.div>
  )
}
