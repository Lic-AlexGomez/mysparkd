"use client"

import { useEffect, useState } from "react"
import type { SparkyExpression } from "@/components/sparky/sparky-types"

export function useSparkyExpressionTransitionWeb(
  target: SparkyExpression,
  delayMs = 280
): SparkyExpression {
  const [displayed, setDisplayed] = useState(target)
  useEffect(() => {
    const id = window.setTimeout(() => setDisplayed(target), delayMs)
    return () => clearTimeout(id)
  }, [target, delayMs])
  return displayed
}
