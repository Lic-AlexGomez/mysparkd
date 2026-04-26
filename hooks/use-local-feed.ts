import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { locationService } from '@/lib/services/location'
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

      if (!Array.isArray(data)) {
        setPosts([])
        setLocationEnabled(true)
        return
      }

      const normalizedPosts: Post[] = data.map((item: any) => {
        const post = item.post || item

        const reactionsObj: Record<string, { type: string; count: number; userReacted: boolean }> = {}
        if (Array.isArray(post.reactions)) {
          post.reactions.forEach((r: any) => {
            reactionsObj[r.reaction] = {
              type: r.reaction,
              count: r.count,
              userReacted: post.myReaction === r.reaction,
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
          expiresAt: post.expiresAt || null,
          permanent: post.permanent !== false,
          locked: post.locked ?? false,
          unlocked: post.unlocked ?? false,
          canUnlock: post.canUnlock ?? false,
          visibility: post.visibility || 'PUBLIC',
          file: post.file || null,
          message: post.message || null,
          likeCount: post.likeCount || 0,
          commentsCount: post.commentsCount || 0,
          repostCount: post.repostCount || 0,
          repostedByCurrentUser: post.repostedByCurrentUser || false,
          viewCount: post.viewCount || 0,
          shareCount: post.shareCount || 0,
          liked: post.likedByCurrentUser || false,
          saved: post.saved || false,
          reactions: reactionsObj,
          userReaction: post.myReaction || null,
          totalReactions: post.totalReactions || 0,
          reputation: post.reputation,
          verificationLevel: post.verificationLevel,
          media: post.media || undefined,
          poll,
        }
      })

      setPosts(normalizedPosts.filter(p => !(p.message && !p.body && !p.file)))
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
