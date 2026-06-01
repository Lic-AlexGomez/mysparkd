import type { LiveFeedResponse } from "@/lib/types/live-activity-feed"
import type { NearbyActivityKind, NearbyActivityPulse } from "@/lib/types/nearby-activity"

function verbToKind(verb: string): NearbyActivityKind {
  switch (verb) {
    case "event_created":
    case "event_join":
      return "new_event"
    case "match":
      return "match_nearby"
    case "group_created":
    case "planning_cluster":
      return "forming_group"
    case "user_active":
      return "live_user"
    case "trending_plan":
    case "social_pulse":
    default:
      return "trending_plan"
  }
}

/** Maps engine DTO to horizontal strip pulses (backward compatible). */
export function liveFeedResponseToPulses(resp: LiveFeedResponse): NearbyActivityPulse[] {
  return resp.items.map((item) => ({
    id: item.id,
    kind: verbToKind(item.verb),
    title: item.headline,
    subtitle: item.subtitle,
    href: item.href || "/feed",
    activityTimestamp: item.timestamp,
    engagementScore: Math.round(Math.min(100, Math.max(0, item.rankScore * 100))),
    visibilityRadiusKm: item.proximityKm,
    geoLabel:
      item.proximityKm != null && Number.isFinite(item.proximityKm)
        ? `~${item.proximityKm.toFixed(1)} km`
        : undefined,
  }))
}
