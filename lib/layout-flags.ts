import type { VisualAppearanceId } from "@/lib/visual-appearances"
import type { NavbarStyle, UiPreferences } from "@/lib/ui-preferences"

export type LayoutFlags = {
  showEngagementStats: boolean
  showTopRanking: boolean
  rankingVariant: "carousel" | "corona"
  showFeedTabs: boolean
  showClassicFilters: boolean
  useCompactEvents: boolean
  useNeonEventCards: boolean
  useNeonCards: boolean
  useCyberGlow: boolean
  useMinimalNeonFeed: boolean
  useSwipeDiscoverCards: boolean
  useProfileStatsGrid: boolean
  useObsidianStats: boolean
  useProfileNeon: boolean
  useFloatingDock: boolean
  showStories: boolean
  showTrendingHashtags: boolean
}

export type FeedConfig = {
  tabStyle: UiPreferences["feedTabStyle"]
  tabIndicator: UiPreferences["feedTabIndicator"]
  defaultView: UiPreferences["feedDefaultView"]
  postCardStyle: UiPreferences["postCardStyle"]
  filterAlign: UiPreferences["filterSheetAlign"]
  showFiltersBar: boolean
}

export type EventsConfig = {
  layout: UiPreferences["eventsLayout"]
  neonBorders: boolean
}

export type ProfileConfig = {
  statsHeader: boolean
  statsVariant: "obsidian" | "neon" | "default"
  gridGlow: boolean
}

export type DiscoverConfig = {
  largeCards: boolean
  showActionDock: boolean
}

export type NavConfig = {
  style: NavbarStyle
  floating: boolean
}

/** Navbar default sugerido por skin (modo Ambos). */
export const SKIN_DEFAULT_NAVBAR: Record<VisualAppearanceId, NavbarStyle> = {
  sparkd: "default",
  "neon-eventos": "gradient",
  "feed-clasico": "flat",
  "cyber-negro": "glass",
  "obsidian-stats": "elevated",
  "neon-feed": "minimal",
  "discover-cards": "pill",
  "top-ranking": "bubbles",
  "feed-tabs": "line",
  "dock-flotante": "dock",
  "ranking-corona": "rounded",
  "perfil-neon": "glass",
  "eventos-compacto": "compact",
}

export function resolveLayoutFlags(
  appearance: VisualAppearanceId,
  ui: UiPreferences
): LayoutFlags {
  const isRanking = appearance === "top-ranking" || appearance === "ranking-corona"
  const isStatsSkin =
    appearance === "obsidian-stats" || appearance === "perfil-neon" || appearance === "ranking-corona"

  return {
    showEngagementStats: isStatsSkin || ui.profileStatsHeader,
    showTopRanking: ui.showFeedTopRanking || isRanking,
    rankingVariant: appearance === "ranking-corona" ? "corona" : "carousel",
    showFeedTabs: ui.feedTabStyle === "discover" || appearance === "feed-tabs",
    showClassicFilters: appearance === "feed-clasico" || ui.filterSheetAlign === "right",
    useCompactEvents: ui.eventsLayout === "compact" || appearance === "eventos-compacto",
    useNeonEventCards: appearance === "neon-eventos",
    useNeonCards:
      appearance === "neon-eventos" ||
      appearance === "neon-feed" ||
      appearance === "perfil-neon" ||
      appearance === "cyber-negro",
    useCyberGlow: appearance === "cyber-negro",
    useMinimalNeonFeed: appearance === "neon-feed",
    useSwipeDiscoverCards: appearance === "discover-cards" || ui.postCardStyle === "dating",
    useProfileStatsGrid: appearance === "perfil-neon" || ui.profileStatsHeader,
    useObsidianStats: appearance === "obsidian-stats",
    useProfileNeon: appearance === "perfil-neon",
    useFloatingDock: appearance === "dock-flotante",
    showStories: !ui.hideStoryCircles,
    showTrendingHashtags: !ui.hideTrendingHashtags,
  }
}

export function resolveFeedConfig(appearance: VisualAppearanceId, ui: UiPreferences): FeedConfig {
  const flags = resolveLayoutFlags(appearance, ui)
  return {
    tabStyle: flags.showFeedTabs ? "discover" : ui.feedTabStyle,
    tabIndicator: ui.feedTabIndicator,
    defaultView: ui.feedDefaultView,
    postCardStyle:
      appearance === "neon-feed" || appearance === "discover-cards"
        ? "dating"
        : appearance === "feed-clasico"
          ? "accent-left"
          : ui.postCardStyle,
    filterAlign: flags.showClassicFilters ? "right" : ui.filterSheetAlign,
    showFiltersBar: flags.showClassicFilters || appearance === "feed-clasico",
  }
}

export function resolveEventsConfig(appearance: VisualAppearanceId, ui: UiPreferences): EventsConfig {
  const flags = resolveLayoutFlags(appearance, ui)
  return {
    layout: flags.useCompactEvents ? "compact" : ui.eventsLayout,
    neonBorders: flags.useNeonEventCards,
  }
}

export function resolveProfileConfig(appearance: VisualAppearanceId, ui: UiPreferences): ProfileConfig {
  return {
    statsHeader: ui.profileStatsHeader || appearance === "perfil-neon" || appearance === "obsidian-stats",
    statsVariant:
      appearance === "perfil-neon" ? "neon" : appearance === "obsidian-stats" ? "obsidian" : "default",
    gridGlow: appearance === "perfil-neon",
  }
}

export function resolveDiscoverConfig(appearance: VisualAppearanceId, ui: UiPreferences): DiscoverConfig {
  return {
    largeCards: appearance === "discover-cards" || ui.postCardStyle === "dating",
    showActionDock: true,
  }
}

export function resolveNavConfig(
  appearance: VisualAppearanceId,
  ui: UiPreferences,
  isFloatingNav: boolean
): NavConfig {
  return {
    style: ui.navbarStyle ?? SKIN_DEFAULT_NAVBAR[appearance] ?? "default",
    floating: isFloatingNav,
  }
}
