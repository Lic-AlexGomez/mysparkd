import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { locationService } from '@/lib/services/location'
import type { Post } from '@/lib/types'

export function useLocalFeed(radiusKm: number = 50) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)

  const fetchLocalFeed = async () => {
    if (!user?.userId) return

    setLoading(true)
    setError(null)

    try {
      const location = await locationService.getCurrentLocation()
      
      if (!location) {
        setError('No se pudo obtener la ubicación')
        setLocationEnabled(false)
        return
      }

      // El backend obtiene el userId del JWT
      await locationService.updateLocation(location)
      const data = await locationService.getLocalFeed(radiusKm)
      setPosts(data)
      setLocationEnabled(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar feed local')
      setLocationEnabled(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.userId) {
      fetchLocalFeed()
    }
  }, [user?.userId, radiusKm])

  return {
    posts,
    loading,
    error,
    locationEnabled,
    refresh: fetchLocalFeed
  }
}
