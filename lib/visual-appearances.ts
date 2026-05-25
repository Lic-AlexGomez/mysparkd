import type { ColorScheme } from "./theme"
import { DEFAULT_UI_PREFERENCES, type UiPreferences } from "./ui-preferences"

/** Apariencia visual completa (skin). `sparkd` = app actual, no modificar sus tokens base. */
export type VisualAppearanceId =
  | "sparkd"
  | "neon-eventos"
  | "feed-clasico"
  | "cyber-negro"
  | "obsidian-stats"
  | "neon-feed"
  | "discover-cards"
  | "top-ranking"
  | "feed-tabs"
  | "dock-flotante"
  | "ranking-corona"
  | "perfil-neon"
  | "eventos-compacto"

export interface VisualAppearanceOption {
  id: VisualAppearanceId
  label: string
  description: string
  /** Colores extraídos del mockup (vista previa en ajustes). */
  previewColors: [string, string, string]
  dark: ColorScheme
  light: ColorScheme
  ui: UiPreferences
}

function lightFromDark(dark: ColorScheme): ColorScheme {
  return {
    ...dark,
    background: "#f4f6f9",
    foreground: "#0f172a",
    card: "#ffffff",
    cardForeground: "#0f172a",
    popover: "#ffffff",
    muted: "#e8ecf2",
    mutedForeground: "#64748b",
    border: "#dde3ec",
    input: "#eef2f7",
    primaryForeground: "#ffffff",
    secondaryForeground: "#ffffff",
  }
}

/** Esquemas oscuros calibrados a partir de los mockups en Downloads/temas. */
const VISUAL_DARK: Record<Exclude<VisualAppearanceId, "sparkd">, ColorScheme> = {
  "neon-eventos": {
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
    pulse: "#ffaa00",
    pulseRed: "#dc2626",
  },
  "feed-clasico": {
    background: "#000000",
    foreground: "#ffffff",
    card: "#0a0a0c",
    cardForeground: "#ffffff",
    popover: "#121214",
    primary: "#00f2ff",
    primaryForeground: "#000000",
    secondary: "#d600ff",
    secondaryForeground: "#ffffff",
    muted: "#111114",
    mutedForeground: "#8e8e93",
    accent: "#bc00ff",
    destructive: "#ef4444",
    border: "#1f1f24",
    input: "#111114",
    ring: "#00f2ff",
    success: "#10b981",
    pulse: "#f97316",
    pulseRed: "#dc2626",
  },
  "cyber-negro": {
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
    pulse: "#ff8c00",
    pulseRed: "#dc2626",
  },
  "obsidian-stats": {
    background: "#050509",
    foreground: "#ffffff",
    card: "#0d0d15",
    cardForeground: "#ffffff",
    popover: "#0d0d15",
    primary: "#05e7fc",
    primaryForeground: "#000000",
    secondary: "#d946ef",
    secondaryForeground: "#ffffff",
    muted: "#12121a",
    mutedForeground: "#8b92a8",
    accent: "#8b5cf6",
    destructive: "#ef4444",
    border: "#2a2b35",
    input: "#12121a",
    ring: "#05e7fc",
    success: "#10b981",
    pulse: "#f97316",
    pulseRed: "#dc2626",
  },
  "neon-feed": {
    background: "#000000",
    foreground: "#ffffff",
    card: "#0a0a0c",
    cardForeground: "#ffffff",
    popover: "#121214",
    primary: "#00fbff",
    primaryForeground: "#000000",
    secondary: "#ff00e5",
    secondaryForeground: "#ffffff",
    muted: "#111114",
    mutedForeground: "#8e8e93",
    accent: "#bd00ff",
    destructive: "#ef4444",
    border: "#1f1f24",
    input: "#111114",
    ring: "#00fbff",
    success: "#10b981",
    pulse: "#fbbf24",
    pulseRed: "#dc2626",
  },
  "discover-cards": {
    background: "#000000",
    foreground: "#ffffff",
    card: "#0d1117",
    cardForeground: "#ffffff",
    popover: "#0d1117",
    primary: "#06efff",
    primaryForeground: "#000000",
    secondary: "#ff2374",
    secondaryForeground: "#ffffff",
    muted: "#161b22",
    mutedForeground: "#8e8e93",
    accent: "#bd00ff",
    destructive: "#ef4444",
    border: "#30363d",
    input: "#161b22",
    ring: "#06efff",
    success: "#10b981",
    pulse: "#fbbf24",
    pulseRed: "#dc2626",
  },
  "top-ranking": {
    background: "#000000",
    foreground: "#ffffff",
    card: "#12121a",
    cardForeground: "#ffffff",
    popover: "#12121a",
    primary: "#06c6d5",
    primaryForeground: "#000000",
    secondary: "#bd00ff",
    secondaryForeground: "#ffffff",
    muted: "#1a1a22",
    mutedForeground: "#8e8e93",
    accent: "#3b82f6",
    destructive: "#ef4444",
    border: "#2a2a35",
    input: "#1a1a22",
    ring: "#06c6d5",
    success: "#10b981",
    pulse: "#fbbf24",
    pulseRed: "#dc2626",
  },
  "feed-tabs": {
    background: "#000000",
    foreground: "#ffffff",
    card: "#0a0a0a",
    cardForeground: "#ffffff",
    popover: "#121212",
    primary: "#08d8ef",
    primaryForeground: "#000000",
    secondary: "#ff1c61",
    secondaryForeground: "#ffffff",
    muted: "#111111",
    mutedForeground: "#8e8e93",
    accent: "#a78bfa",
    destructive: "#ef4444",
    border: "#262626",
    input: "#111111",
    ring: "#08d8ef",
    success: "#10b981",
    pulse: "#f97316",
    pulseRed: "#dc2626",
  },
  "dock-flotante": {
    background: "#000000",
    foreground: "#ffffff",
    card: "#0a0b12",
    cardForeground: "#ffffff",
    popover: "#0a0b12",
    primary: "#05d4e4",
    primaryForeground: "#000000",
    secondary: "#bd00ff",
    secondaryForeground: "#ffffff",
    muted: "#11131c",
    mutedForeground: "#8e8e93",
    accent: "#ff1f6d",
    destructive: "#ef4444",
    border: "#1e2230",
    input: "#11131c",
    ring: "#05d4e4",
    success: "#00ffc2",
    pulse: "#ff8c00",
    pulseRed: "#dc2626",
  },
  "ranking-corona": {
    background: "#000000",
    foreground: "#ffffff",
    card: "#0a0a0c",
    cardForeground: "#ffffff",
    popover: "#121214",
    primary: "#06b8c7",
    primaryForeground: "#000000",
    secondary: "#e100ff",
    secondaryForeground: "#ffffff",
    muted: "#111114",
    mutedForeground: "#8e8e93",
    accent: "#3593c3",
    destructive: "#ef4444",
    border: "#1f1f24",
    input: "#111114",
    ring: "#06b8c7",
    success: "#10b981",
    pulse: "#fbbf24",
    pulseRed: "#dc2626",
  },
  "perfil-neon": {
    background: "#000000",
    foreground: "#ffffff",
    card: "#03060e",
    cardForeground: "#ffffff",
    popover: "#0a0f1a",
    primary: "#33ccff",
    primaryForeground: "#000000",
    secondary: "#9d81ff",
    secondaryForeground: "#ffffff",
    muted: "#0f1420",
    mutedForeground: "#a0a0a0",
    accent: "#7994f0",
    destructive: "#ef4444",
    border: "#1e2a3d",
    input: "#0f1420",
    ring: "#33ccff",
    success: "#00ff41",
    pulse: "#ff2374",
    pulseRed: "#dc2626",
  },
  "eventos-compacto": {
    background: "#000000",
    foreground: "#ffffff",
    card: "#0a0a0a",
    cardForeground: "#ffffff",
    popover: "#0f1014",
    primary: "#01b5a8",
    primaryForeground: "#000000",
    secondary: "#cf0dff",
    secondaryForeground: "#ffffff",
    muted: "#121218",
    mutedForeground: "#9ca3af",
    accent: "#5b227a",
    destructive: "#ef4444",
    border: "#252530",
    input: "#121218",
    ring: "#01b5a8",
    success: "#10b981",
    pulse: "#ff8c00",
    pulseRed: "#ef4444",
  },
}

/** Preset de interfaz (navbar, cards, tabs…) por apariencia, calibrado a los mockups. */
const VISUAL_UI: Record<VisualAppearanceId, UiPreferences> = {
  sparkd: { ...DEFAULT_UI_PREFERENCES },
  "neon-eventos": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "gradient",
    eventsLayout: "cards",
    postCardStyle: "accent-left",
    showLabels: true,
    activeIndicator: "dot",
    hideLiveIndicator: false,
  },
  "feed-clasico": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "flat",
    feedTabStyle: "standard",
    filterSheetAlign: "right",
    feedDefaultView: "card",
    iconSize: "medium",
    activeIndicator: "underline",
  },
  "cyber-negro": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "glass",
    feedTabIndicator: "pill",
    hideStoryCircles: false,
    activeIndicator: "glow",
    postCardStyle: "accent-left",
  },
  "obsidian-stats": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "elevated",
    feedTabStyle: "standard",
    showLabels: true,
    activeIndicator: "dot",
    profileStatsHeader: true,
  },
  "neon-feed": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "minimal",
    feedDefaultView: "card",
    feedTabIndicator: "pill",
    iconSize: "small",
    showLabels: false,
    postCardStyle: "dating",
  },
  "discover-cards": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "pill",
    feedDefaultView: "card",
    postCardStyle: "dating",
    iconSize: "large",
    showLabels: true,
    activeIndicator: "glow",
    navbarHeight: "tall",
  },
  "top-ranking": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "bubbles",
    showFeedTopRanking: true,
    activeIndicator: "glow",
    feedTabStyle: "standard",
  },
  "feed-tabs": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "line",
    feedTabStyle: "discover",
    feedTabIndicator: "underline",
    showLabels: true,
    activeIndicator: "underline",
  },
  "dock-flotante": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "dock",
    navbarHeight: "compact",
    activeIndicator: "dot",
    showLabels: true,
    iconSize: "medium",
  },
  "ranking-corona": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "rounded",
    showFeedTopRanking: true,
    activeIndicator: "glow",
    hideLiveIndicator: true,
    profileStatsHeader: true,
  },
  "perfil-neon": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "glass",
    profileStatsHeader: true,
    showLabels: true,
    activeIndicator: "dot",
    iconSize: "medium",
  },
  "eventos-compacto": {
    ...DEFAULT_UI_PREFERENCES,
    navbarStyle: "compact",
    eventsLayout: "compact",
    feedTabStyle: "standard",
    showLabels: true,
    activeIndicator: "dot",
    hideEventsButton: false,
  },
}

export function getVisualAppearanceUi(id: VisualAppearanceId): UiPreferences {
  return { ...VISUAL_UI[id] }
}

export const VISUAL_APPEARANCE_OPTIONS: VisualAppearanceOption[] = (
  Object.entries(VISUAL_DARK) as [Exclude<VisualAppearanceId, "sparkd">, ColorScheme][]
).map(([id, dark]) => {
  const labels: Record<Exclude<VisualAppearanceId, "sparkd">, { label: string; description: string }> = {
    "neon-eventos": {
      label: "Neon Eventos",
      description: "Tarjetas con borde cyan/magenta y badges de citas",
    },
    "feed-clasico": {
      label: "Feed Clásico",
      description: "Negro puro, drawer de filtros y acentos cyan–morado",
    },
    "cyber-negro": {
      label: "Cyber Negro",
      description: "Feed cyberpunk, historias con anillo neón",
    },
    "obsidian-stats": {
      label: "Obsidian Stats",
      description: "Fondo obsidiana con barra de estadísticas",
    },
    "neon-feed": {
      label: "Neon Feed",
      description: "Feed minimal con likes magenta y repost cyan",
    },
    "discover-cards": {
      label: "Discover Cards",
      description: "Vista discover/swipe con botones circulares",
    },
    "top-ranking": {
      label: "Top Ranking",
      description: "Carrusel top 3 con bordes oro, plata y bronce",
    },
    "feed-tabs": {
      label: "Feed Tabs",
      description: "Pestañas Para ti / Siguiendo con subrayado cyan",
    },
    "dock-flotante": {
      label: "Dock Flotante",
      description: "Nav flotante glass y repost verde neón",
    },
    "ranking-corona": {
      label: "Ranking Corona",
      description: "Top 3 superpuesto con corona dorada",
    },
    "perfil-neon": {
      label: "Perfil Neon",
      description: "Perfil con stats, tabs y nav curvo",
    },
    "eventos-compacto": {
      label: "Eventos Compacto",
      description: "Lista densa con headers en gradiente",
    },
  }
  const meta = labels[id]
  return {
    id,
    label: meta.label,
    description: meta.description,
    previewColors: [dark.primary, dark.secondary, dark.accent] as [string, string, string],
    dark,
    light: lightFromDark(dark),
    ui: getVisualAppearanceUi(id),
  }
})

export const SPARKD_APPEARANCE_OPTION: VisualAppearanceOption = {
  id: "sparkd",
  label: "Sparkd (actual)",
  description: "Apariencia original de la app — no modificada",
  previewColors: ["#00e5ff", "#d946ef", "#8b5cf6"],
  dark: {} as ColorScheme,
  light: {} as ColorScheme,
  ui: getVisualAppearanceUi("sparkd"),
}

export const ALL_VISUAL_APPEARANCE_OPTIONS: VisualAppearanceOption[] = [
  SPARKD_APPEARANCE_OPTION,
  ...VISUAL_APPEARANCE_OPTIONS,
]

export function isVisualAppearanceId(value: string | null): value is VisualAppearanceId {
  return ALL_VISUAL_APPEARANCE_OPTIONS.some((o) => o.id === value)
}

export function getVisualAppearanceColors(
  id: VisualAppearanceId,
  mode: "dark" | "light"
): ColorScheme | null {
  if (id === "sparkd") return null
  const opt = VISUAL_APPEARANCE_OPTIONS.find((o) => o.id === id)
  if (!opt) return null
  return mode === "dark" ? opt.dark : opt.light
}
