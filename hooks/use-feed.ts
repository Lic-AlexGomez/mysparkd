"use client"

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { feedService } from '@/lib/services/feed'
import { profileService } from '@/lib/services/profile'
import { contentValidation } from '@/lib/services/content-validation'
import type { Post } from '@/lib/types'

type SortMode = 'chronological' | 'relevant' | 'compatible' | 'top'

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('chronological')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<any[]>('/api/posts/feed')
      console.log('[Feed Global] Posts obtenidos del servidor:', data)
      
      // Obtener fotos de usuarios únicos
      const uniqueUserIds = [...new Set(data.map(post => post.userId))]
      const userPhotosMap = new Map<string, string>()
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const photo = await profileService.getProfilePhoto(userId)
          if (photo) {
            userPhotosMap.set(userId, photo)
          }
        })
      )
      
      console.log('Fotos de usuarios obtenidas:', userPhotosMap)
      
      // Normalizar posts con reacciones y fotos
      const normalizedPosts = data.map((post) => {
        console.log('=== POST ORIGINAL ====')
        console.log('Post ID:', post.id)
        console.log('username:', post.username)
        console.log('userId:', post.userId)
        console.log('userPhoto del backend:', post.userPhoto)
        console.log('photoUrl del backend:', post.photoUrl)
        console.log('Foto obtenida del perfil:', userPhotosMap.get(post.userId))
        console.log('myReaction:', post.myReaction)
        console.log('reactions array:', post.reactions)
        
        // Convertir array de reacciones a objeto
        const reactionsObj: Record<string, { type: string; count: number; userReacted: boolean }> = {}
        if (Array.isArray(post.reactions)) {
          post.reactions.forEach((r: any) => {
            reactionsObj[r.reaction] = {
              type: r.reaction,
              count: r.count,
              userReacted: post.myReaction === r.reaction
            }
          })
        }
        
        const normalized = {
          id: post.id || '',
          body: post.body || '',
          userId: post.userId || '',
          username: post.username || 'Usuario',
          userPhoto: userPhotosMap.get(post.userId) || post.userPhoto || post.photoUrl || '',
          createdAt: post.createdAt || new Date().toISOString(),
          file: post.file || null,
          visibility: post.visibility || 'PUBLIC',
          likeCount: post.likeCount || 0,
          commentsCount: post.commentsCount || 0,
          viewCount: post.viewCount || 0,
          shareCount: post.shareCount || 0,
          liked: post.likedByCurrentUser || false,
          userReaction: post.myReaction || null,
          reactions: reactionsObj,
          totalReactions: post.totalReactions || 0,
          locked: post.locked || false,
          canUnlock: post.canUnlock || false,
          unlocked: post.unlocked || false,
          permanent: post.permanent !== false,
          expiresAt: post.expiresAt || null,
          reputation: post.reputation,
          verificationLevel: post.verificationLevel,
          repostCount: post.repostCount || 0
        }
        
        console.log('=== POST NORMALIZADO ===')
        console.log('userPhoto normalizado:', normalized.userPhoto)
        console.log('userReaction:', normalized.userReaction)
        console.log('reactions:', normalized.reactions)
        console.log('========================')
        
        return normalized
      })
      
      const filtered = contentValidation.filterBlockedUsers('current-user', normalizedPosts)
      setPosts(feedService.sortPosts(filtered, sortMode))
    } catch (error) {
      console.error('[Feed Global] Error:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [sortMode])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadPosts()
    setRefreshing(false)
  }, [loadPosts])

  const changeSortMode = useCallback((mode: SortMode) => {
    setSortMode(mode)
    setPosts(prev => feedService.sortPosts(prev, mode))
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  return {
    posts,
    sortMode,
    loading,
    refreshing,
    onRefresh,
    changeSortMode,
  }
}
