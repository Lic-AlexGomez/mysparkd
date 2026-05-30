"use client"

import { Fit, Layout, useRive, useStateMachineInput } from "@rive-app/react-canvas"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { CompanionId } from "@/lib/companion/catalog"
import {
  expressionToRiveAnimation,
  expressionToRiveMoodValue,
  SPARKY_RIVE_INPUTS,
  SPARKY_RIVE_STATE_MACHINE,
} from "@/lib/companion/rive-controller"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"

type Props = {
  expression: SparkyExpression
  companionId?: CompanionId
  size?: number
  src?: string
  gaze?: SparkyGaze
  speaking?: boolean
  className?: string
  fallback?: ReactNode
}

/** Rive con fallback SVG si no hay .riv o falla la carga. */
export function CompanionRiveWeb({
  expression,
  companionId = "sparky",
  size = 48,
  src,
  gaze = { x: 0, y: 0 },
  speaking = false,
  className = "",
  fallback = null,
}: Props) {
  void companionId
  const [failed, setFailed] = useState(!src)

  useEffect(() => {
    setFailed(!src)
  }, [src])

  const animationName = useMemo(() => expressionToRiveAnimation(expression), [expression])
  const { rive, RiveComponent } = useRive(
    src && !failed
      ? {
          src,
          autoplay: true,
          stateMachines: SPARKY_RIVE_STATE_MACHINE,
          animations: animationName,
          layout: new Layout({ fit: Fit.Contain }),
          onLoadError: () => setFailed(true),
        }
      : null,
    {
      shouldResizeCanvasToContainer: true,
      useDevicePixelRatio: true,
    }
  )

  const moodInput = useStateMachineInput(rive, SPARKY_RIVE_STATE_MACHINE, SPARKY_RIVE_INPUTS.mood, 0)
  const speakingInput = useStateMachineInput(
    rive,
    SPARKY_RIVE_STATE_MACHINE,
    SPARKY_RIVE_INPUTS.speaking,
    false
  )
  const gazeXInput = useStateMachineInput(rive, SPARKY_RIVE_STATE_MACHINE, SPARKY_RIVE_INPUTS.gazeX, 0)
  const gazeYInput = useStateMachineInput(rive, SPARKY_RIVE_STATE_MACHINE, SPARKY_RIVE_INPUTS.gazeY, 0)
  const celebrateInput = useStateMachineInput(rive, SPARKY_RIVE_STATE_MACHINE, SPARKY_RIVE_INPUTS.celebrate)

  useEffect(() => {
    if (moodInput) moodInput.value = expressionToRiveMoodValue(expression)
    if (speakingInput) speakingInput.value = speaking || expression === "speaking"
    if (gazeXInput) gazeXInput.value = Math.max(-1, Math.min(1, gaze.x))
    if (gazeYInput) gazeYInput.value = Math.max(-1, Math.min(1, gaze.y))
    if (celebrateInput && expression === "celebrating" && typeof celebrateInput.fire === "function") {
      celebrateInput.fire()
    }
  }, [expression, speaking, gaze.x, gaze.y, moodInput, speakingInput, gazeXInput, gazeYInput, celebrateInput])

  if (failed || !src) {
    return fallback
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        filter:
          "drop-shadow(0 0 16px rgba(236,72,153,0.45)) drop-shadow(0 0 24px rgba(99,102,241,0.35)) drop-shadow(0 10px 18px rgba(15,23,42,0.45))",
      }}
    >
      <RiveComponent style={{ width: size, height: size }} />
    </div>
  )
}
