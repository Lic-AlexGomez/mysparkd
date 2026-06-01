"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { SparkyCharacterWeb } from "@/components/sparky/SparkyCharacterWeb"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { CompanionId } from "@/lib/companion/catalog"

type SparkyStageWebProps = {
  enabled: boolean
  expression: SparkyExpression
  companionId?: CompanionId
}

/** Modo escritorio: mascota sigue el cursor (Fase 4). */
export function SparkyStageWeb({ enabled, expression, companionId = "sparky" }: SparkyStageWebProps) {
  const reduceMotion = useReducedMotion()
  const [pos, setPos] = useState({ x: 24, y: 24 })

  useEffect(() => {
    if (!enabled || reduceMotion) return
    const onMove = (e: MouseEvent) => {
      setPos({ x: Math.min(window.innerWidth - 80, e.clientX + 12), y: Math.min(window.innerHeight - 80, e.clientY + 12) })
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [enabled, reduceMotion])

  if (!enabled) return null

  return (
    <motion.div
      className="pointer-events-none fixed z-[55]"
      style={{ left: pos.x, top: pos.y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <SparkyCharacterWeb expression={expression} companionId={companionId} size={52} />
    </motion.div>
  )
}
