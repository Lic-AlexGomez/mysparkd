export type NavbarStyle =
  | "default"
  | "flat"
  | "pill"
  | "minimal"
  | "glass"
  | "dock"
  | "line"
  | "elevated"
  | "rounded"
  | "compact"
  | "gradient"

export type VisualAppearanceId = "sparkd" | "neon-eventos" | "cyber-negro"

export interface UiPreferences {
  navbarStyle: NavbarStyle
  showLabels: boolean
  hideLiveIndicator: boolean
  activeIndicator: "dot" | "underline" | "glow"
  iconSize: "small" | "medium" | "large"
  navbarHeight: "compact" | "normal" | "tall"
}

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  navbarStyle: "default",
  showLabels: true,
  hideLiveIndicator: false,
  activeIndicator: "dot",
  iconSize: "medium",
  navbarHeight: "normal",
}
