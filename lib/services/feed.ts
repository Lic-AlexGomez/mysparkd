import type { Post } from '../types'
import { compatibilityService } from './compatibility'

type SortMode = 'chronological' | 'relevant' | 'compatible' | 'top'

export const feedService = {
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
