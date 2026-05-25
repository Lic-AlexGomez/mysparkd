import type { HelpRouteKey } from "@/lib/help-assistant"
import type { SparkyAnchor } from "@/lib/sparky-motion"

export const SPARKY_HOME_ANCHOR: SparkyAnchor = "bottomRight"

/** Ancla contextual por pantalla — Sparky se acerca antes de hablar. */
export function routeToContextAnchor(routeKey: HelpRouteKey | null): SparkyAnchor {
  switch (routeKey) {
    case "feed":
      return "nearFeed"
    case "events":
      return "nearEvents"
    case "discover":
      return "nearSwipeActions"
    case "profile":
      return "nearProfileStats"
    case "settings-appearance":
      return "nearSettings"
    case "chat":
      return "nearNavbar"
    default:
      return SPARKY_HOME_ANCHOR
  }
}

export function shouldPeekOnRoute(routeKey: HelpRouteKey | null): boolean {
  return routeKey != null && routeKey !== "chat"
}
