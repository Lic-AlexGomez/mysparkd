import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { locationService } from '@/lib/services/location'
import { isDisplayableFeedPost, normalizePost } from '@/lib/normalize-post'
import type { Post } from '@/lib/types'

export function useLocalFeed(radiusKm: number = 50) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)

  const fetchLocalFeed = useCallback(async () => {
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

      await locationService.updateLocation(location)
      const data = await locationService.getLocalFeed(radiusKm)

      const rows = Array.isArray(data)
        ? data
        : data && typeof data === "object" && Array.isArray((data as { content?: unknown[] }).content)
          ? (data as { content: unknown[] }).content
          : []

      const normalizedPosts: Post[] = rows
        .map((item: unknown) => normalizePost(item))
        .filter(isDisplayableFeedPost)
      setPosts(normalizedPosts)
      setLocationEnabled(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar feed local')
      setLocationEnabled(false)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [user?.userId, radiusKm])

  useEffect(() => {
    if (user?.userId) {
      fetchLocalFeed()
    }
  }, [fetchLocalFeed])

  return {
    posts,
    loading,
    error,
    locationEnabled,
    refresh: fetchLocalFeed,
  }
}
