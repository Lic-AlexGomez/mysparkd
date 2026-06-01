import type { LiveFeedItem } from "@/lib/types/live-activity-feed"
import type { SparkdEvent } from "@/lib/types/sparkd-event"

/** GET /api/feed/live — catalog-backed events + live activity slice. */
export interface FeedLiveResponse {
  events: SparkdEvent[]
  activity: LiveFeedItem[]
  meta: {
    generated_at: string
    partial: boolean
  }
}
