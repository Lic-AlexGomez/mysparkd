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
      const data = await api.get<Post[]>('/api/posts/feed')
      const filtered = contentValidation.filterBlockedUsers('current-user', data)
      setPosts(feedService.sortPosts(filtered, sortMode))
    } catch {
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
