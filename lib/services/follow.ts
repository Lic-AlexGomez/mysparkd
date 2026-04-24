import { api } from '@/lib/api'

interface Follow {
  followerId: string
  followingId: string
  status: 'accepted' | 'pending'
  createdAt: string
}

export interface FollowCounts {
  followersCount: number
  followingCount: number
}

class FollowService {
  private follows: Follow[] = []

  constructor() {
    this.loadFollows()
  }

  private loadFollows() {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('sparkd_follows')
    if (saved) this.follows = JSON.parse(saved)
  }

  private saveFollows() {
    if (typeof window === 'undefined') return
    localStorage.setItem('sparkd_follows', JSON.stringify(this.follows))
  }

  follow(followerId: string, followingId: string, isPrivate: boolean = false): Follow {
    const existing = this.follows.find(
      f => f.followerId === followerId && f.followingId === followingId
    )
    if (existing) return existing

    const follow: Follow = {
      followerId,
      followingId,
      status: isPrivate ? 'pending' : 'accepted',
      createdAt: new Date().toISOString(),
    }
    this.follows.push(follow)
    this.saveFollows()
    api.post(`/api/follow/${followingId}`).catch(e => console.error('Error sync follow:', e))
    return follow
  }

  unfollow(followerId: string, followingId: string) {
    this.follows = this.follows.filter(
      f => !(f.followerId === followerId && f.followingId === followingId)
    )
    this.saveFollows()
    api.delete(`/api/follow/${followingId}`).catch(e => console.error('Error sync unfollow:', e))
  }

  isFollowing(followerId: string, followingId: string): boolean {
    return this.follows.some(
      f => f.followerId === followerId && f.followingId === followingId && f.status === 'accepted'
    )
  }

  isPending(followerId: string, followingId: string): boolean {
    return this.follows.some(
      f => f.followerId === followerId && f.followingId === followingId && f.status === 'pending'
    )
  }

  getFollowStatus(followerId: string, followingId: string): 'none' | 'pending' | 'accepted' {
    const follow = this.follows.find(
      f => f.followerId === followerId && f.followingId === followingId
    )
    return follow ? follow.status : 'none'
  }

  // Conteos locales como fallback
  getFollowersCount(userId: string): number {
    return this.follows.filter(f => f.followingId === userId && f.status === 'accepted').length
  }

  getFollowingCount(userId: string): number {
    return this.follows.filter(f => f.followerId === userId && f.status === 'accepted').length
  }

  // Conteos reales desde el backend
  async getFollowCounts(userId: string): Promise<FollowCounts> {
    try {
      return await api.get<FollowCounts>(`/api/follow/${userId}/counts`)
    } catch {
      return {
        followersCount: this.getFollowersCount(userId),
        followingCount: this.getFollowingCount(userId),
      }
    }
  }

  async getFollowers(userId: string) {
    return api.get<any[]>(`/api/follow/${userId}/followers`)
  }

  async getFollowing(userId: string) {
    return api.get<any[]>(`/api/follow/${userId}/following`)
  }
}

export const followService = new FollowService()
