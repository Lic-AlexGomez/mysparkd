import { api } from '../api'

export interface LocationData {
  latitude: number
  longitude: number
}

export const locationService = {
  async updateLocation(userId: string, location: LocationData) {
    return api.post(`/api/feed/location/${userId}`, location)
  },

  async getLocalFeed(userId: string, radiusKm: number = 50) {
    return api.get(`/api/feed/local/${userId}?radiusKm=${radiusKm}`)
  },

  async getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        () => resolve(null)
      )
    })
  },

  async requestAndUpdateLocation(userId: string): Promise<boolean> {
    const location = await this.getCurrentLocation()
    if (!location) return false

    try {
      await this.updateLocation(userId, location)
      return true
    } catch {
      return false
    }
  }
}
