interface Follow {
  followerId: string
  followingId: string
  status: 'accepted' | 'pending'
  createdAt: string
}

class FollowService {
  private follows: Follow[] = []

  constructor() {
    this.loadFollows()
  }

  private loadFollows() {
    const saved = localStorage.getItem('sparkd_follows')
    if (saved) {
      this.follows = JSON.parse(saved)
    }
  }

  private saveFollows() {
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
    return follow
  }

  unfollow(followerId: string, followingId: string) {
    this.follows = this.follows.filter(
      f => !(f.followerId === followerId && f.followingId === followingId)
    )
    this.saveFollows()
  }

  isFollowing(followerId: string, followingId: string): boolean {
    return this.follows.some(
      f => f.followerId === followerId && f.followingId === followingId && f.status === 'accepted'
    )
  }

  getFollowersCount(userId: string): number {
    return this.follows.filter(f => f.followingId === userId && f.status === 'accepted').length
  }

  getFollowingCount(userId: string): number {
    return this.follows.filter(f => f.followerId === userId && f.status === 'accepted').length
  }
}

export const followService = new FollowService()
