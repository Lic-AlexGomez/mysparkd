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
      
      console.log('=== FEED LOCAL ===');
      console.log('Datos recibidos del backend:', data);
      console.log('Tipo de datos:', typeof data);
      console.log('Es array?:', Array.isArray(data));
      console.log('Cantidad de posts:', Array.isArray(data) ? data.length : 'N/A');
      
      // Validar que data sea un array
      if (!Array.isArray(data)) {
        console.error('Feed local no es un array:', data)
        setPosts([])
        setLocationEnabled(true)
        return
      }
      
      // Normalizar las fechas y campos de los posts
      const normalizedPosts = data.map((post: any) => ({
        id: post.id || '',
        body: post.body || '',
        userId: post.userId || '',
        username: post.username || 'Usuario',
        userPhoto: post.userPhoto || '',
        createdAt: post.createdAt || new Date().toISOString(),
        expiresAt: post.expiresAt || null,
        permanent: post.permanent ?? true,
        locked: post.locked ?? false,
        visibility: post.visibility || 'PUBLIC',
        file: post.file || null,
        likeCount: post.likeCount || 0,
        commentsCount: post.commentsCount || 0,
        repostCount: post.repostCount || 0,
        viewCount: post.viewCount || 0,
        shareCount: post.shareCount || 0,
        liked: post.liked || false,
        reactions: post.reactions || {},
        userReaction: post.userReaction || null,
        reputation: post.reputation || 0,
        verificationLevel: post.verificationLevel || 0,
        poll: post.poll || null,
        distance: post.distance || null
      }))
      
      console.log('Posts normalizados:', normalizedPosts);
      console.log('Primer post (ejemplo):', normalizedPosts[0]);
      
      setPosts(normalizedPosts)
      setLocationEnabled(true)
    } catch (err) {
      console.error('Error fetching local feed:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar feed local')
      setLocationEnabled(false)
      setPosts([]) // Asegurar que posts sea un array vacío en caso de error
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
