import { api } from "@/lib/api"
import { locationService } from "@/lib/services/location"

export type FeedLocationResponse = {
  latitude?: number | null
  longitude?: number | null
  virtualLatitude?: number | null
  virtualLongitude?: number | null
  hasVirtualLocation?: boolean
}

export function effectiveFeedCoords(loc: FeedLocationResponse | null | undefined): {
  lat: number | null
  lng: number | null
  fromVirtual: boolean
} {
  if (!loc) return { lat: null, lng: null, fromVirtual: false }
  if (loc.hasVirtualLocation && loc.virtualLatitude != null && loc.virtualLongitude != null) {
    return { lat: loc.virtualLatitude, lng: loc.virtualLongitude, fromVirtual: true }
  }
  if (loc.latitude != null && loc.longitude != null) {
    return { lat: loc.latitude, lng: loc.longitude, fromVirtual: false }
  }
  return { lat: null, lng: null, fromVirtual: false }
}

export const feedLocationService = {
  async get(): Promise<FeedLocationResponse | null> {
    try {
      return await api.get<FeedLocationResponse>("/api/feed/location")
    } catch {
      return null
    }
  },

  async saveReal(coords: { latitude: number; longitude: number }) {
    return api.post("/api/feed/location", coords)
  },

  async setVirtual(coords: { latitude: number; longitude: number }) {
    return api.put("/api/feed/location/virtual", coords)
  },

  async clearVirtual() {
    return api.delete("/api/feed/location/virtual")
  },

  async requestBrowserAndSave(): Promise<boolean> {
    return locationService.requestAndUpdateLocation()
  },

  async requestBrowser(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      return await locationService.getCurrentLocation()
    } catch {
      return null
    }
  },
}
