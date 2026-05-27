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
import { applyColorSchemeToDocument } from "./apply-css"
import {
  THEME_PALETTE_OPTIONS,
  THEME_STORAGE_KEYS,
  buildColorScheme,
  isThemePalette,
  type ThemePalette,
} from "./theme"
import {
  getVisualAppearanceUi,
  isVisualAppearanceId,
  type VisualAppearanceId,
} from "./visual-appearances"
import { DEFAULT_UI_PREFERENCES, type NavbarStyle, type UiPreferences } from "./types"

export type { ThemePalette, VisualAppearanceId }
export { THEME_PALETTE_OPTIONS } from "./theme"
export { ONBOARDING_APPEARANCE_OPTIONS } from "./visual-appearances"

interface AppearanceContextValue {
  visualAppearance: VisualAppearanceId
  palette: ThemePalette
  uiPrefs: UiPreferences
  ready: boolean
  setVisualAppearance: (id: VisualAppearanceId) => void
  setPalette: (id: ThemePalette) => void
  setNavbarStyle: (style: NavbarStyle) => void
  applyAppearanceChoice: (visual: VisualAppearanceId, palette: ThemePalette) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function loadUiPrefs(): UiPreferences {
  if (typeof window === "undefined") return DEFAULT_UI_PREFERENCES
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEYS.uiPreferences)
    if (!raw) return DEFAULT_UI_PREFERENCES
    return { ...DEFAULT_UI_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_UI_PREFERENCES
  }
}

function persistUiPrefs(prefs: UiPreferences) {
  localStorage.setItem(THEME_STORAGE_KEYS.uiPreferences, JSON.stringify(prefs))
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [visualAppearance, setVisualAppearanceState] = useState<VisualAppearanceId>("sparkd")
  const [palette, setPaletteState] = useState<ThemePalette>("default")
  const [uiPrefs, setUiPrefs] = useState<UiPreferences>(DEFAULT_UI_PREFERENCES)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const storedVisual = localStorage.getItem(THEME_STORAGE_KEYS.visualAppearance)
    const storedPalette = localStorage.getItem(THEME_STORAGE_KEYS.palette)
    if (isVisualAppearanceId(storedVisual)) setVisualAppearanceState(storedVisual)
    if (isThemePalette(storedPalette)) setPaletteState(storedPalette)
    setUiPrefs(loadUiPrefs())
    setReady(true)
  }, [])

  const colors = useMemo(
    () => buildColorScheme(palette, visualAppearance),
    [palette, visualAppearance]
  )

  useEffect(() => {
    if (!ready) return
    applyColorSchemeToDocument(colors)
    document.documentElement.dataset.navbarStyle = uiPrefs.navbarStyle
  }, [colors, uiPrefs.navbarStyle, ready])

  const setVisualAppearance = useCallback((id: VisualAppearanceId) => {
    setVisualAppearanceState(id)
    localStorage.setItem(THEME_STORAGE_KEYS.visualAppearance, id)
    const preset = getVisualAppearanceUi(id)
    setUiPrefs(preset)
    persistUiPrefs(preset)
  }, [])

  const setPalette = useCallback((id: ThemePalette) => {
    setPaletteState(id)
    localStorage.setItem(THEME_STORAGE_KEYS.palette, id)
  }, [])

  const applyAppearanceChoice = useCallback((visual: VisualAppearanceId, pal: ThemePalette) => {
    setVisualAppearanceState(visual)
    setPaletteState(pal)
    localStorage.setItem(THEME_STORAGE_KEYS.visualAppearance, visual)
    localStorage.setItem(THEME_STORAGE_KEYS.palette, pal)
    const preset = getVisualAppearanceUi(visual)
    setUiPrefs(preset)
    persistUiPrefs(preset)
  }, [])

  const setNavbarStyle = useCallback((style: NavbarStyle) => {
    setUiPrefs((prev) => {
      const next = { ...prev, navbarStyle: style }
      persistUiPrefs(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      visualAppearance,
      palette,
      uiPrefs,
      ready,
      setVisualAppearance,
      setPalette,
      setNavbarStyle,
      applyAppearanceChoice,
    }),
    [
      visualAppearance,
      palette,
      uiPrefs,
      ready,
      setVisualAppearance,
      setPalette,
      setNavbarStyle,
      applyAppearanceChoice,
    ]
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) {
    throw new Error("useAppearance must be used within AppearanceProvider")
  }
  return ctx
}

export function useAppearanceOptional() {
  return useContext(AppearanceContext)
}
