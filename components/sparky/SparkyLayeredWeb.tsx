"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"
import type { CompanionId } from "@/lib/companion/catalog"

function useSmoothGaze(gaze: SparkyGaze): SparkyGaze {
  const [smooth, setSmooth] = useState(gaze)

  useEffect(() => {
    let id = 0
    const tick = () => {
      setSmooth((prev) => ({
        x: prev.x + (gaze.x - prev.x) * 0.12,
        y: prev.y + (gaze.y - prev.y) * 0.12,
      }))
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [gaze.x, gaze.y])

  return smooth
}

type Props = {
  expression?: SparkyExpression
  companionId?: CompanionId
  size?: number
  gaze?: SparkyGaze
  wardrobeAccessory?: string | null
  className?: string
}

export function SparkyLayeredWeb({
  expression = "idle",
  size = 48,
  gaze = { x: 0, y: 0 },
  className = "",
}: Props) {
  const reduceMotion = useReducedMotion()
  const uid = useId().replace(/:/g, "")
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (reduceMotion) return
    let cancelled = false
    let t = 0
    const loop = () => {
      if (cancelled) return
      t = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 80)
        loop()
      }, 2800 + Math.random() * 3200)
    }
    loop()
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [reduceMotion])

  const smoothGaze = useSmoothGaze(gaze)
  const face = useMemo(() => resolveFace(expression, blink, smoothGaze), [expression, blink, smoothGaze])

  return (
    <motion.div
      data-sparky-svg="cute-blob-kawaii-eyes"
      data-sparky-expression={expression}
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        filter:
          "drop-shadow(0 0 8px rgba(56,189,248,0.45)) drop-shadow(0 0 14px rgba(192,132,252,0.22))",
      }}
      aria-hidden
      animate={
        reduceMotion
          ? { rotate: face.bodyTilt }
          : {
              y: [0, -3.5, -1.2, -3.5, 0],
              rotate: [
                face.bodyTilt - 2.5,
                face.bodyTilt + 1.8,
                face.bodyTilt - 1.2,
                face.bodyTilt + 2,
                face.bodyTilt - 2.5,
              ],
              scale: [1, 1.03, 1.015, 1.03, 1],
            }
      }
      transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#e879f9" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-body`} cx="50%" cy="42%" r="52%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="55%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id={`${uid}-belly`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ecfeff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-iris`} cx="38%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="35%" stopColor="#38bdf8" />
            <stop offset="75%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>
        </defs>

        <circle cx="50" cy="54" r="36" fill={`url(#${uid}-glow)`} />

        <ellipse cx="34" cy="78" rx="5" ry="4" fill="#93c5fd" opacity="0.55" />
        <ellipse cx="66" cy="78" rx="5" ry="4" fill="#93c5fd" opacity="0.55" />

        <ellipse cx="50" cy="54" rx="30" ry="32" fill={`url(#${uid}-body)`} />
        <ellipse cx="50" cy="56" rx="20" ry="18" fill={`url(#${uid}-belly)`} />

        <ellipse cx="38" cy="38" rx="9" ry="5.5" fill="#ffffff" opacity="0.45" />

        {face.showCheeks ? (
          <>
            <ellipse cx="30" cy="57" rx="4.8" ry="3" fill="#fda4af" opacity="0.6" />
            <ellipse cx="70" cy="57" rx="4.8" ry="3" fill="#fda4af" opacity="0.6" />
          </>
        ) : null}

        <SparkyEye
          cx={36}
          cy={face.eyeY}
          scaleY={face.leftEyeScaleY}
          pupilX={face.pupilX}
          pupilY={face.pupilY}
          irisId={`${uid}-iris`}
        />
        <SparkyEye
          cx={64}
          cy={face.eyeY}
          scaleY={face.rightEyeScaleY}
          pupilX={face.pupilX}
          pupilY={face.pupilY}
          irisId={`${uid}-iris`}
        />

        {face.mouth === "smile" ? (
          <path d="M42 66 Q50 71 58 66" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        ) : null}
        {face.mouth === "open" ? (
          <ellipse cx="50" cy="67" rx="3.5" ry="2.8" fill="#475569" />
        ) : null}
        {face.mouth === "sad" ? (
          <path d="M43 69 Q50 64 57 69" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        ) : null}
        {face.mouth === "o" ? (
          <ellipse cx="50" cy="67" rx="2.2" ry="2.8" fill="none" stroke="#475569" strokeWidth="1.4" />
        ) : null}

        {face.thinking ? (
          <g opacity="0.7">
            <circle cx="74" cy="30" r="1.5" fill="#c4b5fd" />
            <circle cx="78" cy="24" r="2" fill="#93c5fd" />
          </g>
        ) : null}
      </svg>
    </motion.div>
  )
}

function SparkyEye({
  cx,
  cy,
  scaleY,
  pupilX,
  pupilY,
  irisId,
}: {
  cx: number
  cy: number
  scaleY: number
  pupilX: number
  pupilY: number
  irisId: string
}) {
  const ix = pupilX * 0.75
  const iy = pupilY * 0.65

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g transform={`scale(1 ${scaleY})`}>
        <ellipse cx={0} cy={0} rx={7.4} ry={8} fill="#ffffff" />
        <ellipse cx={0} cy={0} rx={7.4} ry={8} fill="none" stroke="#bae6fd" strokeWidth="0.55" opacity="0.9" />

        <g transform={`translate(${ix} ${iy})`}>
          <ellipse cx={0} cy={0.2} rx={4.9} ry={5.4} fill={`url(#${irisId})`} />
          <ellipse cx={0} cy={0.5} rx={2.6} ry={2.9} fill="#7dd3fc" opacity="0.35" />
          <circle cx={0} cy={0.6} r={1.05} fill="#1e3a5f" />
          <circle cx={1.7} cy={-1.5} r={1.45} fill="#ffffff" />
          <circle cx={-1.2} cy={1.4} r={0.6} fill="#ffffff" opacity="0.8" />
        </g>

        <ellipse cx={ix} cy={iy + 3.8} rx={2.2} ry={0.75} fill="#ffffff" opacity="0.4" />
      </g>
    </g>
  )
}

function resolveFace(expression: SparkyExpression, blink: boolean, gaze: SparkyGaze) {
  const isSad = expression === "sad" || expression === "sleepy"
  const isExcited = expression === "excited" || expression === "celebrating"
  const isScared = expression === "scared"
  const isSpeaking = expression === "speaking"
  const isThinking = expression === "thinking" || expression === "confused"
  const isWink = expression === "wink"

  const eyeY = isSad ? 52 : 49

  let leftEyeScaleY = 1
  let rightEyeScaleY = 1
  if (blink) {
    leftEyeScaleY = 0.12
    rightEyeScaleY = 0.12
  } else if (isWink) {
    leftEyeScaleY = 1
    rightEyeScaleY = 0.15
  } else if (isSad) {
    leftEyeScaleY = 0.45
    rightEyeScaleY = 0.45
  }

  let mouth: "smile" | "open" | "sad" | "o" | "none" = "smile"
  if (isSad) mouth = "sad"
  else if (isScared) mouth = "o"
  else if (isSpeaking || isExcited) mouth = "open"

  const pupilX = isThinking ? 0.8 : gaze.x
  const pupilY = isThinking ? -1.2 : isSad ? 0.6 : gaze.y

  return {
    eyeY,
    pupilX,
    pupilY,
    leftEyeScaleY,
    rightEyeScaleY,
    mouth,
    showCheeks: !isSad && !isScared,
    thinking: isThinking,
    bodyTilt: gaze.x * 5 + gaze.y * 2.5,
  }
}
