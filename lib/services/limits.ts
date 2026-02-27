type TrustLevel = 0 | 1 | 2

interface Limits {
  posts: number
  likes: number
  reposts: number
}

const LIMITS: Record<TrustLevel, Limits> = {
  0: { posts: 3, likes: 50, reposts: 5 },
  1: { posts: 8, likes: 100, reposts: 10 },
  2: { posts: 20, likes: 200, reposts: 20 },
}

export const limitsService = {
  checkLimit(action: keyof Limits, trustLevel: TrustLevel, current: number): boolean {
    return current < LIMITS[trustLevel][action]
  },

  getLimit(action: keyof Limits, trustLevel: TrustLevel): number {
    return LIMITS[trustLevel][action]
  },

  getRemainingActions(action: keyof Limits, trustLevel: TrustLevel, current: number): number {
    return Math.max(0, LIMITS[trustLevel][action] - current)
  }
}
