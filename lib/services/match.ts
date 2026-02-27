interface Match {
  matchId: string
  userId1: string
  userId2: string
  createdAt: string
}

class MatchService {
  private matches: Match[] = []
  private likes = new Map<string, Set<string>>()

  constructor() {
    this.loadData()
  }

  private loadData() {
    const savedMatches = localStorage.getItem('sparkd_matches')
    const savedLikes = localStorage.getItem('sparkd_likes')
    
    if (savedMatches) {
      this.matches = JSON.parse(savedMatches)
    }
    
    if (savedLikes) {
      const data = JSON.parse(savedLikes)
      Object.entries(data).forEach(([userId, likedIds]) => {
        this.likes.set(userId, new Set(likedIds as string[]))
      })
    }
  }

  private saveData() {
    localStorage.setItem('sparkd_matches', JSON.stringify(this.matches))
    
    const likesData: Record<string, string[]> = {}
    this.likes.forEach((likedIds, userId) => {
      likesData[userId] = Array.from(likedIds)
    })
    localStorage.setItem('sparkd_likes', JSON.stringify(likesData))
  }

  like(userId: string, targetId: string): { matched: boolean } {
    if (!this.likes.has(userId)) {
      this.likes.set(userId, new Set())
    }
    
    this.likes.get(userId)!.add(targetId)
    
    const targetLikes = this.likes.get(targetId)
    const matched = targetLikes?.has(userId) || false
    
    if (matched) {
      const match: Match = {
        matchId: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId1: userId,
        userId2: targetId,
        createdAt: new Date().toISOString(),
      }
      this.matches.push(match)
    }
    
    this.saveData()
    return { matched }
  }

  getMatches(userId: string): Match[] {
    return this.matches.filter(m => m.userId1 === userId || m.userId2 === userId)
  }

  isMatch(userId1: string, userId2: string): boolean {
    return this.matches.some(
      m => (m.userId1 === userId1 && m.userId2 === userId2) ||
           (m.userId1 === userId2 && m.userId2 === userId1)
    )
  }
}

export const matchService = new MatchService()
