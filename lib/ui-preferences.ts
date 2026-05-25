export type NavbarStyle =
  | "default"
  | "flat"
  | "pill"
  | "minimal"
  | "bubbles"
  | "glass"
  | "dock"
  | "line"
  | "elevated"
  | "rounded"
  | "compact"
  | "gradient"
  | "dating-dock"

export type IconSize = "small" | "medium" | "large"
export type ActiveIndicator = "dot" | "underline" | "glow" | "none"
export type BadgePosition = "top-right" | "top-center" | "none"
export type FeedTabStyle = "standard" | "discover"
export type FeedTabIndicator = "pill" | "underline"
export type PostCardStyle = "default" | "accent-left" | "dating"
export type EventsLayout = "cards" | "compact"
export type FilterSheetAlign = "bottom" | "right"

export interface UiPreferences {
  navbarStyle: NavbarStyle
  hideEventsButton: boolean
  hideLiveIndicator: boolean
  hideStoryCircles: boolean
  hideTrendingHashtags: boolean
  iconSize: IconSize
  showLabels: boolean
  activeIndicator: ActiveIndicator
  badgePosition: BadgePosition
  navbarHeight: "compact" | "normal" | "tall"
  feedTabStyle: FeedTabStyle
  feedTabIndicator: FeedTabIndicator
  feedDefaultView: "card" | "compact"
  showFeedTopRanking: boolean
  postCardStyle: PostCardStyle
  eventsLayout: EventsLayout
  filterSheetAlign: FilterSheetAlign
  profileStatsHeader: boolean
}

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  navbarStyle: "default",
  hideEventsButton: false,
  hideLiveIndicator: false,
  hideStoryCircles: false,
  hideTrendingHashtags: false,
  iconSize: "medium",
  showLabels: true,
  activeIndicator: "dot",
  badgePosition: "top-right",
  navbarHeight: "normal",
  feedTabStyle: "standard",
  feedTabIndicator: "pill",
  feedDefaultView: "card",
  showFeedTopRanking: false,
  postCardStyle: "default",
  eventsLayout: "cards",
  filterSheetAlign: "bottom",
  profileStatsHeader: false,
}
