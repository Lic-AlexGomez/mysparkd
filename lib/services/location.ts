import { api } from '../api'

export interface LocationData {
  latitude: number
  longitude: number
}

export const locationService = {
  async updateLocation(location: LocationData) {
    // El backend obtiene el userId del JWT, no lo necesitamos en la URL
    return api.post('/api/feed/location', location)
  },

  async getLocalFeed(radiusKm: number = 50) {
    // El backend obtiene el userId del JWT
    return api.get(`/api/feed/local?radiusKm=${radiusKm}`)
  },

  async getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'))
        return
      }

      // Opciones para forzar el popup de permisos
      const options = {
        enableHighAccuracy: true, // Forzar solicitud de permisos
        timeout: 15000, // 15 segundos
        maximumAge: 0 // No usar caché, siempre solicitar nueva ubicación
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          // Silenciar en consola — es esperado cuando el usuario deniega el permiso
          let errorMessage = 'Error al obtener ubicación'
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible.'
              break
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado.'
              break
          }
          reject(new Error(errorMessage))
        },
        options
      )
    })
  },

  async requestAndUpdateLocation(): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation()
      if (!location) return false
      await this.updateLocation(location)
      return true
    } catch {
      return false
    }
  }
}
