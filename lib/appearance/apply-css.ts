import type { ColorScheme } from "./theme"

const CSS_VAR_MAP: Record<keyof ColorScheme, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  success: "--success",
}

export function applyColorSchemeToDocument(scheme: ColorScheme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  ;(Object.keys(CSS_VAR_MAP) as (keyof ColorScheme)[]).forEach((key) => {
    root.style.setProperty(CSS_VAR_MAP[key], scheme[key])
  })
  root.style.setProperty("--chart-1", scheme.primary)
  root.style.setProperty("--chart-2", scheme.secondary)
  root.style.setProperty("--chart-3", scheme.accent)
  root.style.setProperty("--sidebar-primary", scheme.primary)
  root.style.setProperty("--sidebar-ring", scheme.ring)
}
