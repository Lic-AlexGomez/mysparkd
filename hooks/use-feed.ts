"use client"

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { feedService } from '@/lib/services/feed'
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
      const data = await api.get<any[]>('/api/feed/feed')
      
      // Normalizar posts — la foto ya viene en profilePictureUrl
      const normalizedPosts = data.map((post) => {
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
        
        let poll = null
        if (post.poll) {
          const p = post.poll
          const totalVotes = p.options?.reduce((sum: number, o: any) => sum + (o.voteCount || 0), 0) || 0
          poll = {
            id: p.pollId || '',
            question: p.question || '',
            options: (p.options || []).map((o: any) => ({
              id: o.id || '',
              text: o.text || '',
              votes: o.voteCount || 0,
              percentage: o.percentage || 0,
            })),
            totalVotes,
            expiresAt: p.expiresAt || new Date().toISOString(),
            userVoted: p.myVoteOptionId || null,
            allowMultiple: false,
          }
        }

        return {
          id: post.id || '',
          body: post.body ?? null,
          userId: post.userId ? String(post.userId) : '',
          username: post.username || 'Usuario',
          userPhoto: post.profilePictureUrl || post.userPhoto || post.photoUrl || '',
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
          message: post.message || null,
          reputation: post.reputation,
          verificationLevel: post.verificationLevel,
          repostCount: post.repostCount || 0,
          poll,
        }
      })
      
      const filtered = contentValidation.filterBlockedUsers('current-user', normalizedPosts)
        .filter(p => !(p.message && !p.body && !p.file))
      setPosts(feedService.sortPosts(filtered, sortMode))
    } catch (error) {
      console.error('[useFeed] Error cargando feed:', error)
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
