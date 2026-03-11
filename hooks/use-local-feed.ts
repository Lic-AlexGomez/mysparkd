import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { locationService } from '@/lib/services/location'
import { profileService } from '@/lib/services/profile'
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
      
      // Obtener fotos de usuarios únicos
      const uniqueUserIds = [...new Set(data.map((item: any) => {
        const post = item.post || item
        return post.userId
      }))]
      const userPhotosMap = new Map<string, string>()
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const photo = await profileService.getProfilePhoto(userId)
          if (photo) {
            userPhotosMap.set(userId, photo)
          }
        })
      )
      
      console.log('Fotos de usuarios obtenidas (feed local):', userPhotosMap)
      
      // Normalizar las fechas y campos de los posts
      const normalizedPosts = data.map((item: any) => {
        console.log('Post original del backend:', item);
        
        // El backend puede devolver un objeto con estructura diferente
        const post = item.post || item; // Algunos endpoints envuelven el post
        
        // Convertir el array de reacciones a objeto con formato esperado
        const reactionsObj: any = {}
        if (post.reactions && Array.isArray(post.reactions)) {
          post.reactions.forEach((r: any) => {
            reactionsObj[r.reaction] = {
              type: r.reaction,
              count: r.count,
              userReacted: post.myReaction === r.reaction
            }
          })
        }
        
        console.log('myReaction del backend:', post.myReaction);
        console.log('reactionsObj convertido:', reactionsObj);
        
        const normalizedPost = {
          id: post.id || '',
          body: post.body || '',
          userId: post.userId || '',
          username: post.username || 'Usuario',
          userPhoto: userPhotosMap.get(post.userId) || post.userPhoto || post.photoUrl || '',
          createdAt: post.createdAt || new Date().toISOString(),
          expiresAt: post.expiresAt || null,
          permanent: post.permanent ?? true,
          locked: post.locked ?? false,
          unlocked: post.unlocked ?? false,
          canUnlock: post.canUnlock ?? false,
          visibility: post.visibility || 'PUBLIC',
          file: post.file || null,
          likeCount: post.likeCount || 0,
          commentsCount: post.commentsCount || 0,
          repostCount: post.repostCount || 0,
          viewCount: post.viewCount || 0,
          shareCount: post.shareCount || 0,
          liked: post.likedByCurrentUser || false,
          reactions: reactionsObj,
          userReaction: post.myReaction || null,  // IMPORTANTE: myReaction del backend
          totalReactions: post.totalReactions || 0,
          reputation: post.reputation || 0,
          verificationLevel: post.verificationLevel || 0,
          poll: post.poll || null,
          distance: item.distance || post.distance || null
        };
        
        console.log('Post normalizado - userReaction:', normalizedPost.userReaction);
        console.log('Post normalizado completo:', normalizedPost);
        
        return normalizedPost;
      });
      
      console.log('Posts normalizados:', normalizedPosts);
      console.log('Primer post normalizado (ejemplo):', normalizedPosts[0]);
      
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
