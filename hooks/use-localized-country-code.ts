"use client"

import { useEffect, useState } from "react"

/** ISO 3166-1 alpha-2 from locale (e.g. es-AR → AR) or undefined. */
export function useLocalizedCountryCode(): string | undefined {
  const [code, setCode] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (typeof navigator === "undefined") return
    const region = navigator.language?.split("-")[1]?.trim().toLowerCase()
    if (region && region.length === 2) {
      setCode(region)
      return
    }
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions().locale?.split("-")[1]?.toLowerCase()
      if (resolved && resolved.length === 2) setCode(resolved)
    } catch {
      /* ignore */
    }
  }, [])

  return code
}
