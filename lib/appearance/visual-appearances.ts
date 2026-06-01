import type { ColorScheme } from "./theme"
import { DEFAULT_UI_PREFERENCES, type UiPreferences, type VisualAppearanceId } from "./types"

export type { VisualAppearanceId }

export interface OnboardingAppearanceOption {
  id: VisualAppearanceId
  labelKey: string
  descriptionKey: string
  previewColors: [string, string, string]
  dark: ColorScheme | null
  ui: UiPreferences
}

const neonEventosDark: ColorScheme = {
  background: "#0a0b14",
  foreground: "#ffffff",
  card: "#13121a",
  cardForeground: "#ffffff",
  popover: "#13121a",
  primary: "#00e5ff",
  primaryForeground: "#000000",
  secondary: "#d400ff",
  secondaryForeground: "#ffffff",
  muted: "#1a1b23",
  mutedForeground: "#9ca3af",
  accent: "#8b5cf6",
  destructive: "#ef4444",
  border: "#2a2b35",
  input: "#1a1b23",
  ring: "#00e5ff",
  success: "#00ff88",
}

const cyberNegroDark: ColorScheme = {
  background: "#000000",
  foreground: "#ffffff",
  card: "#0a0a0c",
  cardForeground: "#ffffff",
  popover: "#121214",
  primary: "#00e5ff",
  primaryForeground: "#000000",
  secondary: "#ff00ff",
  secondaryForeground: "#ffffff",
  muted: "#0d0d10",
  mutedForeground: "#8e8e93",
  accent: "#e100ff",
  destructive: "#ef4444",
  border: "#25252b",
  input: "#0d0d10",
  ring: "#00e5ff",
  success: "#10b981",
}

const VISUAL_UI: Record<VisualAppearanceId, UiPreferences> = {
  sparkd: { ...DEFAULT_UI_PREFERENCES },
  "neon-eventos": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "gradient",
    activeIndicator: "glow",
  },
  "cyber-negro": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "glass",
    activeIndicator: "glow",
    showLabels: true,
  },
}

export function getVisualAppearanceUi(id: VisualAppearanceId): UiPreferences {
  return { ...VISUAL_UI[id] }
}

export const ONBOARDING_APPEARANCE_OPTIONS: OnboardingAppearanceOption[] = [
  {
    id: "sparkd",
    labelKey: "onboarding.appearance.sparkd.title",
    descriptionKey: "onboarding.appearance.sparkd.description",
    previewColors: ["#00e5ff", "#d946ef", "#8b5cf6"],
    dark: null,
    ui: getVisualAppearanceUi("sparkd"),
  },
  {
    id: "neon-eventos",
    labelKey: "onboarding.appearance.neon.title",
    descriptionKey: "onboarding.appearance.neon.description",
    previewColors: ["#00e5ff", "#d400ff", "#8b5cf6"],
    dark: neonEventosDark,
    ui: getVisualAppearanceUi("neon-eventos"),
  },
  {
    id: "cyber-negro",
    labelKey: "onboarding.appearance.cyber.title",
    descriptionKey: "onboarding.appearance.cyber.description",
    previewColors: ["#00e5ff", "#ff00ff", "#e100ff"],
    dark: cyberNegroDark,
    ui: getVisualAppearanceUi("cyber-negro"),
  },
]

export function isVisualAppearanceId(value: string | null): value is VisualAppearanceId {
  return ONBOARDING_APPEARANCE_OPTIONS.some((o) => o.id === value)
}

export function getVisualAppearanceColors(id: VisualAppearanceId): ColorScheme | null {
  const opt = ONBOARDING_APPEARANCE_OPTIONS.find((o) => o.id === id)
  return opt?.dark ?? null
}
