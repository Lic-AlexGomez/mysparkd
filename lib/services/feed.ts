import { api } from '../api'
import type { Post } from '../types'

type SortMode = 'chronological' | 'relevant' | 'compatible' | 'top'

function normalizePost(post: any): Post {
  const reactionsObj: Record<string, any> = {}
  if (Array.isArray(post?.reactions)) {
    post.reactions.forEach((reaction: any) => {
      reactionsObj[reaction.reaction] = {
        type: reaction.reaction,
        count: reaction.count,
        userReacted: post.myReaction === reaction.reaction,
      }
    })
  }

  return {
    id: post?.id || '',
    body: post?.body ?? null,
    userId: post?.userId ? String(post.userId) : '',
    username: post?.username || 'Usuario',
    userPhoto: post?.profilePictureUrl || post?.userPhoto || '',
    createdAt: post?.createdAt || new Date().toISOString(),
    file: post?.file || null,
    visibility: post?.visibility || 'PUBLIC',
    likeCount: post?.likeCount || 0,
    commentsCount: post?.commentsCount || 0,
    viewCount: post?.viewCount || 0,
    shareCount: post?.shareCount || 0,
    liked: post?.likedByCurrentUser || false,
    saved: post?.saved || false,
    userReaction: post?.myReaction || null,
    reactions: reactionsObj,
    totalReactions: post?.totalReactions || 0,
    locked: post?.locked || false,
    canUnlock: post?.canUnlock || false,
    unlocked: post?.unlocked || false,
    permanent: post?.permanent !== false,
    expiresAt: post?.expiresAt || null,
    message: post?.message || null,
    reputation: post?.reputation,
    verificationLevel: post?.verificationLevel,
    repostCount: post?.repostCount || 0,
    repostedByCurrentUser: post?.repostedByCurrentUser || false,
    media: post?.media || null,
    poll: null,
  } as Post
}

export const feedService = {
  async getFollowingFeed(): Promise<Post[]> {
    const data = await api.get<any[]>('/api/feed/following')
    const rows = Array.isArray(data) ? data : []
    return rows
      .map(normalizePost)
      .filter((post) => !(post.message && !post.body && !post.file))
  },

  sortPosts(posts: Post[], mode: SortMode, currentUserId?: string): Post[] {
    const sorted = [...posts]
    
    switch (mode) {
      case 'chronological':
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      
      case 'relevant':
        return sorted.sort((a, b) => {
          const engagementA = (a.likeCount || 0) + (a.commentsCount || 0) * 2 + (a.repostCount || 0) * 3
          const engagementB = (b.likeCount || 0) + (b.commentsCount || 0) * 2 + (b.repostCount || 0) * 3
          
          const timeA = new Date(a.createdAt).getTime()
          const timeB = new Date(b.createdAt).getTime()
          const now = Date.now()
          const decayA = 1 - (now - timeA) / (1000 * 60 * 60 * 24 * 7)
          const decayB = 1 - (now - timeB) / (1000 * 60 * 60 * 24 * 7)
          
          const scoreA = engagementA * Math.max(0.1, decayA)
          const scoreB = engagementB * Math.max(0.1, decayB)
          
          return scoreB - scoreA
        })
      
      case 'compatible':
        return sorted.sort((a, b) => {
          const repA = (a.reputation || 50) + (a.verificationLevel || 0) * 10
          const repB = (b.reputation || 50) + (b.verificationLevel || 0) * 10
          return repB - repA
        })
      
      case 'top':
        return sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      
      default:
        return sorted
    }
  }
}
