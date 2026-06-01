"use client"

import { useEffect, useRef, useState } from "react"

/** Semilla estable por día + mood (no cambia en cada render). */
export function stableDaySeed(mood: string): number {
  const day = new Date().toISOString().slice(0, 10)
  let h = 0
  for (const c of `${day}:${mood}`) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

/**
 * Mantiene una frase visible al menos `minDisplayMs` antes de cambiar.
 * Evita ráfagas "aquí sigo" → "hola" → "…" al abrir el rinconcito.
 */
export function useStableSparkyLine(
  preferred: string | null | undefined,
  fallback: string,
  minDisplayMs = 14_000
): string {
  const [displayed, setDisplayed] = useState(() => preferred?.trim() || fallback)
  const lastShownAt = useRef(Date.now())
  const displayedRef = useRef(displayed)

  useEffect(() => {
    const next = (preferred?.trim() || fallback).trim()
    if (!next || next === displayedRef.current) return

    const apply = () => {
      displayedRef.current = next
      setDisplayed(next)
      lastShownAt.current = Date.now()
    }

    const elapsed = Date.now() - lastShownAt.current
    if (elapsed >= minDisplayMs) {
      apply()
      return
    }

    const t = setTimeout(apply, minDisplayMs - elapsed)
    return () => clearTimeout(t)
  }, [preferred, fallback, minDisplayMs])

  return displayed
}
