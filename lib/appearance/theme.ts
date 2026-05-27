import type { VisualAppearanceId } from "./types"
import { getVisualAppearanceColors } from "./visual-appearances"

export type ThemePalette = "default" | "violet" | "rose" | "emerald" | "amber" | "ocean"

export const THEME_STORAGE_KEYS = {
  palette: "sparkd_theme_palette",
  visualAppearance: "sparkd_visual_appearance",
  uiPreferences: "sparkd_ui_preferences",
} as const

export interface ThemePaletteOption {
  id: ThemePalette
  label: string
  primary: string
  secondary: string
  accent: string
}

export const THEME_PALETTE_OPTIONS: ThemePaletteOption[] = [
  { id: "default", label: "Sparkd", primary: "#00e5ff", secondary: "#d946ef", accent: "#8b5cf6" },
  { id: "violet", label: "Violeta", primary: "#a78bfa", secondary: "#c084fc", accent: "#7c3aed" },
  { id: "rose", label: "Rosa", primary: "#fb7185", secondary: "#f472b6", accent: "#e11d48" },
  { id: "emerald", label: "Esmeralda", primary: "#34d399", secondary: "#2dd4bf", accent: "#059669" },
  { id: "amber", label: "Ámbar", primary: "#fbbf24", secondary: "#fb923c", accent: "#d97706" },
  { id: "ocean", label: "Océano", primary: "#38bdf8", secondary: "#60a5fa", accent: "#0284c7" },
]

export interface ColorScheme {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  destructive: string
  border: string
  input: string
  ring: string
  success: string
}

export const darkColors: ColorScheme = {
  background: "#0a0b0f",
  foreground: "#e0f7fa",
  card: "#13141a",
  cardForeground: "#e0f7fa",
  popover: "#13141a",
  primary: "#00e5ff",
  primaryForeground: "#000000",
  secondary: "#d946ef",
  secondaryForeground: "#FFFFFF",
  muted: "#1a1b23",
  mutedForeground: "#8b92a8",
  accent: "#8b5cf6",
  destructive: "#ef4444",
  border: "#2a2b35",
  input: "#1a1b23",
  ring: "#00e5ff",
  success: "#10b981",
}

const paletteById = Object.fromEntries(
  THEME_PALETTE_OPTIONS.map((p) => [p.id, p])
) as Record<ThemePalette, ThemePaletteOption>

function applyPaletteToBase(base: ColorScheme, paletteId: ThemePalette): ColorScheme {
  const palette = paletteById[paletteId] ?? paletteById.default
  return {
    ...base,
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    ring: palette.primary,
  }
}

export function buildColorScheme(
  paletteId: ThemePalette,
  visualAppearanceId: VisualAppearanceId = "sparkd"
): ColorScheme {
  const skin = getVisualAppearanceColors(visualAppearanceId)
  const base = skin ?? { ...darkColors }
  return applyPaletteToBase(base, paletteId)
}

export function isThemePalette(value: string | null): value is ThemePalette {
  return THEME_PALETTE_OPTIONS.some((p) => p.id === value)
}
