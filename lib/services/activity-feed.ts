import { api } from '../api'

export type FeedItemType = 'DATE' | 'MEETUP'

export interface UnifiedFeedItem {
  type: FeedItemType
  id: string
  title: string
  description?: string
  locationZone?: string
  dateTime?: string
  category?: string
  status?: string
  createdAt?: string
  creatorId?: string
  creatorUsername?: string
  /** Foto del creador (feed unificado). Se mapea a `creatorProfilePictureUrl` en la vista de evento. */
  creatorPhotoUrl?: string
  creatorReputation?: number
  // DATE only (date cards)
  detail?: string
  plans?: string[]
  placeTypes?: string[]
  distance?: number
  compatibility?: number
  age?: number
  weight?: number
  expiresAt?: string
  // MEETUP only (events)
  coverPhotoUrl?: string
  free?: boolean
  price?: number
  minGuests?: number
  maxGuests?: number
  currentApprovedCount?: number
  full?: boolean
  officialAddress?: string
  zone?: string
}

export interface ActivityFeedFilter {
  type?: FeedItemType
  eventCategory?: string
  free?: boolean
  lat?: number
  lng?: number
  radiusKm?: number
  maxDistanceKm?: number
  minCompatibility?: number
  minAge?: number
  maxAge?: number
}

export const activityFeedService = {
  async getFeed(filter: ActivityFeedFilter = {}): Promise<UnifiedFeedItem[]> {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v))
    })
    const qs = params.toString()
    return api.get<UnifiedFeedItem[]>(`/api/activity-feed${qs ? `?${qs}` : ''}`)
  }
}
