"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { CompanionRiveWeb } from "@/components/sparky/CompanionRiveWeb"
import { Sparky3D } from "@/components/sparky/Sparky3D"
import { SparkyLayeredWeb } from "@/components/sparky/SparkyLayeredWeb"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import { getCompanionById, type CompanionId } from "@/lib/companion/catalog"
import { getCompanionSkin } from "@/lib/companion/companion-skin"
import type { AvatarStyleId } from "@/lib/companion/avatar-styles"
import { normalizeAvatarStyle } from "@/lib/companion/avatar-styles"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"
import { SPARKY_3D_MIN_SIZE, type Sparky3DMood } from "@/lib/companion/sparky-face-web"
import {
  SPARKY_EXPRESSION_SPRITE,
  SPARKY_THINKING_FRAMES,
  spriteBackgroundPosition,
  type SpriteCell,
} from "@/lib/companion/sparky-sprite-map"
import styles from "@/components/sparky/sparky-character.module.css"

type SparkyCharacterWebProps = {
  expression?: SparkyExpression
  companionId?: CompanionId
  avatarStyle?: AvatarStyleId | string | null
  wardrobeAccessory?: string | null
  size?: number
  className?: string
  gaze?: SparkyGaze
  /** Uso interno para evitar fallback recursivo cuando Rive falla. */
  disableRive?: boolean
}

const MOOD_FILTER: Record<SparkyExpression, string> = {
  idle: "",
  happy: "brightness(1.08)",
  wink: "",
  sleepy: "brightness(0.92) saturate(0.9)",
  thinking: "hue-rotate(8deg)",
  excited: "brightness(1.15) saturate(1.2)",
  celebrating: "brightness(1.12) saturate(1.15)",
  speaking: "",
  confused: "hue-rotate(14deg)",
  sad: "brightness(0.82) saturate(0.75)",
  scared: "hue-rotate(18deg) contrast(1.08)",
}

const NEON_DROP_SHADOW =
  "drop-shadow(0 0 14px rgba(236, 72, 153, 0.55)) drop-shadow(0 0 28px rgba(139, 92, 246, 0.35)) drop-shadow(0 10px 18px rgba(15, 23, 42, 0.45))"

function useThinkingFrame(active: boolean, reduceMotion: boolean | null) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!active || reduceMotion) {
      setFrame(0)
      return
    }
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % SPARKY_THINKING_FRAMES.length)
    }, 280)
    return () => clearInterval(id)
  }, [active, reduceMotion])

  return frame
}

function useIdleLifeFrame(active: boolean, reduceMotion: boolean | null) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!active || reduceMotion) {
      setFrame(0)
      return
    }
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % 2)
    }, 1800)
    return () => clearInterval(id)
  }, [active, reduceMotion])

  return frame
}

function resolveSpriteCell(
  expression: SparkyExpression,
  thinkingFrame: number,
  idleLifeFrame: number
): SpriteCell {
  if (expression === "idle" || expression === "happy" || expression === "speaking") {
    return idleLifeFrame === 0 ? SPARKY_EXPRESSION_SPRITE.happy : { col: 1, row: 1 }
  }
  if (expression === "thinking") {
    return SPARKY_THINKING_FRAMES[thinkingFrame] ?? SPARKY_EXPRESSION_SPRITE.thinking
  }
  return SPARKY_EXPRESSION_SPRITE[expression] ?? SPARKY_EXPRESSION_SPRITE.idle
}

function mapExpressionToMood(expression: SparkyExpression): Sparky3DMood {
  if (expression === "happy") return "happy"
  if (expression === "thinking") return "thinking"
  if (expression === "sad" || expression === "sleepy") return "sad"
  if (expression === "excited" || expression === "celebrating") return "excited"
  if (expression === "confused" || expression === "scared") return "confused"
  if (expression === "wink" || expression === "speaking") return "curious"
  return "idle"
}

function LegacyAvatarBody({
  styleId,
  size,
  skin,
  companionId,
  reduceMotion,
}: {
  styleId: AvatarStyleId
  size: number
  skin: ReturnType<typeof getCompanionSkin>
  companionId: CompanionId
  reduceMotion: boolean | null
}) {
  const grad = `linear-gradient(135deg, ${skin.primary}, ${skin.secondary}, ${skin.accent})`
  const glow = `0 0 ${size * 0.45}px ${skin.accent}55`

  if (styleId === "star") {
    return (
      <div
        className="absolute inset-[6%]"
        style={{
          background: grad,
          clipPath:
            "polygon(50% 0%, 61% 32%, 98% 35%, 68% 57%, 79% 91%, 50% 72%, 21% 91%, 32% 57%, 2% 35%, 39% 32%)",
          boxShadow: glow,
        }}
      />
    )
  }

  return (
    <div
      className="absolute inset-0 rounded-full"
      style={{ background: grad, boxShadow: glow }}
    />
  )
}

function SparkySpriteAvatar({
  expression,
  size,
  wardrobeAccessory,
  skin,
  reduceMotion,
  gaze,
  className,
}: {
  expression: SparkyExpression
  size: number
  wardrobeAccessory: string | null
  skin: ReturnType<typeof getCompanionSkin>
  reduceMotion: boolean | null
  gaze: SparkyGaze
  className: string
}) {
  const thinkingFrame = useThinkingFrame(expression === "thinking", reduceMotion)
  const idleLifeFrame = useIdleLifeFrame(
    expression === "idle" || expression === "happy" || expression === "speaking",
    reduceMotion
  )
  const cell = useMemo(
    () => resolveSpriteCell(expression, thinkingFrame, idleLifeFrame),
    [expression, thinkingFrame, idleLifeFrame]
  )
  const spriteStyle = useMemo(() => spriteBackgroundPosition(cell, size), [cell, size])
  const moodFilter = MOOD_FILTER[expression] ?? ""
  const tilt = expression === "thinking" ? 0 : gaze.x * 5

  return (
    <div
      className={`${styles.sparkySpriteRoot} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className={styles.sparkySpriteGlow} />
      <motion.div
        className={`${styles.sparkySprite} ${styles.sparkySpriteBody} ${!reduceMotion ? styles.sparkySpriteFloat : ""}`}
        style={{
          width: size,
          height: size,
          backgroundSize: spriteStyle.backgroundSize,
          backgroundPosition: spriteStyle.backgroundPosition,
          filter: [moodFilter, NEON_DROP_SHADOW].filter(Boolean).join(" "),
        }}
        animate={reduceMotion ? undefined : { rotate: [tilt - 2, tilt + 2, tilt] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {wardrobeAccessory ? (
        <div
          className={styles.sparkyWardrobe}
          style={{
            top: wardrobeAccessory === "wardrobe_crown" ? -2 : 4,
            width: size * 0.45,
            height: size * 0.12,
            backgroundColor: skin.accent,
          }}
        />
      ) : null}
    </div>
  )
}

export function SparkyCharacterWeb({
  expression = "idle",
  companionId = "sparky",
  avatarStyle: avatarStyleProp,
  wardrobeAccessory = null,
  size = 48,
  className = "",
  gaze = { x: 0, y: 0 },
  disableRive = false,
}: SparkyCharacterWebProps) {
  const reduceMotion = useReducedMotion()
  const skin = getCompanionSkin(companionId)
  const styleId = normalizeAvatarStyle(avatarStyleProp)
  const def = getCompanionById(companionId)
  const riveSrc = def.riveAsset
  const useRive = false
  const isSparky = companionId === "sparky"
  const useSparkySvg = isSparky && size <= SPARKY_3D_MIN_SIZE
  const useSparky3D = isSparky && size > SPARKY_3D_MIN_SIZE
  const useSpriteSheet = false

  const sparkySvgAvatar = (
    <SparkyLayeredWeb
      expression={expression}
      companionId={companionId}
      size={size}
      gaze={gaze}
      className={className}
    />
  )

  const sparky3DAvatar = (
    <Sparky3D
      mood={mapExpressionToMood(expression)}
      size={size}
      gaze={gaze}
      wardrobeAccessory={wardrobeAccessory}
      className={className}
      interactive
      reduceMotion={reduceMotion}
    />
  )

  const legacyAvatar = (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size, filter: (MOOD_FILTER[expression] ?? "") || undefined }}
      animate={
        reduceMotion
          ? undefined
          : {
              y: [0, -5, 0],
              scale: [1, 1.05, 1.02, 1],
              rotate: [gaze.x * 6 - 2, gaze.x * 6 + 2, gaze.x * 6],
            }
      }
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <LegacyAvatarBody
        styleId={styleId}
        size={size}
        skin={skin}
        companionId={companionId}
        reduceMotion={reduceMotion}
      />
      {wardrobeAccessory ? (
        <div
          className={styles.sparkyWardrobe}
          style={{
            top: wardrobeAccessory === "wardrobe_crown" ? -2 : 4,
            width: size * 0.45,
            height: size * 0.12,
            backgroundColor: skin.accent,
          }}
        />
      ) : null}
    </motion.div>
  )

  if (useSparkySvg) {
    return sparkySvgAvatar
  }

  if (useSparky3D) {
    return sparky3DAvatar
  }

  if (useRive && riveSrc) {
    return (
      <CompanionRiveWeb
        expression={expression}
        companionId={companionId}
        size={size}
        src={riveSrc}
        gaze={gaze}
        speaking={expression === "speaking"}
        className={className}
        fallback={sparky3DAvatar}
      />
    )
  }

  if (useSpriteSheet) {
    return (
      <SparkySpriteAvatar
        expression={expression}
        size={size}
        wardrobeAccessory={wardrobeAccessory}
        skin={skin}
        reduceMotion={reduceMotion}
        gaze={gaze}
        className={className}
      />
    )
  }

  return legacyAvatar
}
