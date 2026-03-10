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
          console.error('Geolocation error:', error)
          let errorMessage = 'Error al obtener ubicación'
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación en la configuración del navegador.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible. Verifica que el GPS esté activado.'
              break
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.'
              break
          }
          
          reject(new Error(errorMessage))
        },
        options
      )
    })
  },

  async requestAndUpdateLocation(userId: string): Promise<boolean> {
    try {
      // Verificar si estamos en un contexto seguro
      if (!window.isSecureContext) {
        console.error('Geolocation requires HTTPS or localhost')
        throw new Error('La geolocalización requiere HTTPS. Por favor, accede a través de localhost o usa HTTPS.')
      }
      
      const location = await this.getCurrentLocation()
      if (!location) return false

      await this.updateLocation(userId, location)
      return true
    } catch (error) {
      console.error('Error in requestAndUpdateLocation:', error)
      throw error // Propagar el error para que se muestre en la UI
    }
  }
}
