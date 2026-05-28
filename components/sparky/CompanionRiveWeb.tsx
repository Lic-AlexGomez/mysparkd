"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { SparkyCharacterWeb } from "@/components/sparky/SparkyCharacterWeb"
import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { CompanionId } from "@/lib/companion/catalog"

const RiveComponent = dynamic(
  () => import("@rive-app/react-canvas").then((m) => m.RiveComponent),
  { ssr: false }
)

type Props = {
  expression: SparkyExpression
  companionId?: CompanionId
  size?: number
  src?: string
}

/** Rive con fallback SVG si no hay .riv o falla la carga. */
export function CompanionRiveWeb({ expression, companionId = "sparky", size = 48, src }: Props) {
  const [failed, setFailed] = useState(!src)

  useEffect(() => {
    setFailed(!src)
  }, [src])

  if (failed || !src) {
    return <SparkyCharacterWeb expression={expression} companionId={companionId} size={size} />
  }

  return (
    <div style={{ width: size, height: size }}>
      <RiveComponent
        src={src}
        style={{ width: size, height: size }}
        onLoadError={() => setFailed(true)}
      />
    </div>
  )
}
