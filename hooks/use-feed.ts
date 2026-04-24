"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { feedService } from '@/lib/services/feed'
import type { Post } from '@/lib/types'

type SortMode = 'chronological' | 'relevant' | 'compatible' | 'top'

function normalizePost(post: any): Post {
  const reactionsObj: Record<string, any> = {}
  if (Array.isArray(post.reactions)) {
    post.reactions.forEach((r: any) => {
      reactionsObj[r.reaction] = { type: r.reaction, count: r.count, userReacted: post.myReaction === r.reaction }
    })
  }

  let poll = null
  if (post.poll) {
    const p = post.poll
    const totalVotes = p.options?.reduce((sum: number, o: any) => sum + (o.voteCount || 0), 0) || 0
    poll = {
      id: p.pollId || '',
      question: p.question || '',
      options: (p.options || []).map((o: any) => ({ id: o.id || '', text: o.text || '', votes: o.voteCount || 0, percentage: o.percentage || 0 })),
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
    userPhoto: post.profilePictureUrl || post.userPhoto || '',
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
    media: post.media || null,
    poll,
  } as Post
}

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('chronological')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Actualizar ubicación en background al cargar el feed
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        api.post('/api/feed/location', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }).catch(() => {})
      },
      () => {} // silent si el usuario deniega
    )
  }, [])

  const loadPosts = useCallback(async () => {
    // Cancelar request anterior si existe
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      setLoading(true)
      const data = await api.get<any[]>('/api/feed/feed')
      const normalized = data
        .map(normalizePost)
        .filter(p => !(p.message && !p.body && !p.file))
      setPosts(feedService.sortPosts(normalized, sortMode))
    } catch (error: any) {
      if (error?.name !== 'AbortError') setPosts([])
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
    return () => abortRef.current?.abort()
  }, [loadPosts])

  return { posts, sortMode, loading, refreshing, onRefresh, changeSortMode }
}
