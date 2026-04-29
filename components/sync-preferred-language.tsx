"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useI18n, TOP_10_LANGUAGES, type SupportedLanguage } from "@/lib/i18n"

function parsePreferred(raw: string): SupportedLanguage | null {
  const code = raw.trim().toLowerCase().split(/[-_]/)[0]
  return TOP_10_LANGUAGES.some((l) => l.code === code)
    ? (code as SupportedLanguage)
    : null
}

/** Alinea el idioma de la UI con `preferredLanguage` del perfil cuando `/api/profile/me` lo envía. */
export function SyncPreferredLanguage() {
  const { user } = useAuth()
  const { setLanguage } = useI18n()

  useEffect(() => {
    const raw = user?.preferredLanguage
    if (!raw || typeof raw !== "string") return
    const next = parsePreferred(raw)
    if (!next) return
    setLanguage(next)
  }, [user?.userId, user?.preferredLanguage, setLanguage])

  return null
}
