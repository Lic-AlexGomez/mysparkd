"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  ALL_VISUAL_APPEARANCE_OPTIONS,
  getVisualAppearanceColors,
  isVisualAppearanceId,
  type VisualAppearanceId,
} from "@/lib/visual-appearances"
import { THEME_STORAGE_KEYS } from "@/lib/theme"
import { storage } from "@/lib/storage"

type VisualAppearanceContextValue = {
  visualAppearanceId: VisualAppearanceId
  setVisualAppearanceId: (id: VisualAppearanceId) => void
  options: typeof ALL_VISUAL_APPEARANCE_OPTIONS
}

const VisualAppearanceContext = createContext<VisualAppearanceContextValue | null>(null)

function applyCssVariables(id: VisualAppearanceId) {
  if (typeof document === "undefined") return
  const colors = getVisualAppearanceColors(id, "dark")
  const root = document.documentElement
  if (!colors) {
    root.removeAttribute("data-visual-appearance")
    return
  }
  root.setAttribute("data-visual-appearance", id)
  const map: Record<string, string> = {
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--card": colors.card,
    "--card-foreground": colors.cardForeground,
    "--popover": colors.popover,
    "--popover-foreground": colors.cardForeground,
    "--primary": colors.primary,
    "--primary-foreground": colors.primaryForeground,
    "--secondary": colors.secondary,
    "--secondary-foreground": colors.secondaryForeground,
    "--muted": colors.muted,
    "--muted-foreground": colors.mutedForeground,
    "--accent": colors.accent,
    "--destructive": colors.destructive,
    "--border": colors.border,
    "--input": colors.input,
    "--ring": colors.ring,
    "--success": colors.success,
  }
  for (const [key, value] of Object.entries(map)) {
    root.style.setProperty(key, value)
  }
}

export function VisualAppearanceProvider({ children }: { children: ReactNode }) {
  const [visualAppearanceId, setIdState] = useState<VisualAppearanceId>("sparkd")

  useEffect(() => {
    void storage.getItem(THEME_STORAGE_KEYS.visualAppearance).then((raw) => {
      if (raw && isVisualAppearanceId(raw)) {
        setIdState(raw)
        applyCssVariables(raw)
      }
    })
  }, [])

  useEffect(() => {
    const onApply = (e: Event) => {
      const detail = (e as CustomEvent<{ visualAppearanceId?: VisualAppearanceId }>).detail
      if (detail?.visualAppearanceId && isVisualAppearanceId(detail.visualAppearanceId)) {
        setIdState(detail.visualAppearanceId)
        applyCssVariables(detail.visualAppearanceId)
        void storage.setItem(THEME_STORAGE_KEYS.visualAppearance, detail.visualAppearanceId)
      }
    }
    window.addEventListener("sparky-apply-appearance", onApply)
    return () => window.removeEventListener("sparky-apply-appearance", onApply)
  }, [])

  const setVisualAppearanceId = useCallback((id: VisualAppearanceId) => {
    setIdState(id)
    applyCssVariables(id)
    void storage.setItem(THEME_STORAGE_KEYS.visualAppearance, id)
  }, [])

  const value = useMemo(
    () => ({
      visualAppearanceId,
      setVisualAppearanceId,
      options: ALL_VISUAL_APPEARANCE_OPTIONS,
    }),
    [visualAppearanceId, setVisualAppearanceId]
  )

  return (
    <VisualAppearanceContext.Provider value={value}>{children}</VisualAppearanceContext.Provider>
  )
}

export function useVisualAppearance() {
  const ctx = useContext(VisualAppearanceContext)
  if (!ctx) throw new Error("useVisualAppearance within VisualAppearanceProvider")
  return ctx
}
