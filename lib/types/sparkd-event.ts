/**
 * Canonical event shape for Sparkd clients (infrastructure-agnostic).
 * Internal adapters map upstream rows into this contract — no provider fields.
 */

export interface SparkdEvent {
  id: string
  title: string
  summary?: string
  starts_at?: string
  ends_at?: string
  zone_label?: string
  latitude?: number
  longitude?: number
  attendee_count?: number
  /** 0–100 composite for ranking / Tonight UI */
  momentum?: number
  /** Deep link inside Sparkd app */
  href: string
  cover_image_url?: string | null
  price?: string
  category?: string
  address?: string
  city?: string
  organizerName?: string
  likesCount?: number
}
