import type { VisualAppearanceId } from "./visual-appearances"
import { getVisualAppearanceColors } from "./visual-appearances"

export type ThemePalette = "default" | "violet" | "rose" | "emerald" | "amber" | "ocean"

export const THEME_STORAGE_KEYS = {
  colorMode: "sparkd_theme_appearance",
  palette: "sparkd_theme_palette",
  visualAppearance: "sparkd_visual_appearance",
  legacy: "sparkd_theme",
} as const

export type ThemeColorMode = "dark" | "light" | "system"

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
  pulse: string
  pulseRed: string
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
  secondaryForeground: "#ffffff",
  muted: "#1a1b23",
  mutedForeground: "#8b92a8",
  accent: "#8b5cf6",
  destructive: "#ef4444",
  border: "#2a2b35",
  input: "#1a1b23",
  ring: "#00e5ff",
  success: "#10b981",
  pulse: "#f97316",
  pulseRed: "#dc2626",
}

export function colorsForVisualAppearance(
  id: VisualAppearanceId,
  mode: ThemeColorMode = "dark"
): ColorScheme {
  const resolved = mode === "light" ? "light" : "dark"
  return getVisualAppearanceColors(id, resolved) ?? darkColors
}
