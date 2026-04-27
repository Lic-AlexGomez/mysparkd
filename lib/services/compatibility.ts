import type { User } from '../types'

function normalizeInterest(interest: unknown): string {
  if (typeof interest === "string") return interest
  if (interest && typeof interest === "object") {
    const i = interest as { name?: string; interestId?: string }
    return i.name || i.interestId || ""
  }
  return ""
}

export const compatibilityService = {
  calculateCompatibility(user1: Partial<User>, user2: Partial<User>): number {
    let score = 0
    
    // Intereses compartidos (40%)
    const interests1 = user1.interests || []
    const interests2 = user2.interests || []
    const interests1Names = interests1.map(normalizeInterest).filter(Boolean)
    const interests2Names = interests2.map(normalizeInterest).filter(Boolean)
    const sharedInterests = interests1Names.filter(i => interests2Names.includes(i)).length
    const totalInterests = Math.max(interests1Names.length, interests2Names.length)
    const interestScore = totalInterests > 0 ? (sharedInterests / totalInterests) * 40 : 0
    score += interestScore
    
    // Reputación compatible (35%)
    const rep1 = user1.reputation || 50
    const rep2 = user2.reputation || 50
    const repDiff = Math.abs(rep1 - rep2)
    const repScore = (1 - repDiff / 100) * 35
    score += repScore
    
    // Nivel de verificación (25%)
    const ver1 = user1.verificationLevel || 0
    const ver2 = user2.verificationLevel || 0
    const verScore = Math.min(ver1, ver2) * 6.25
    score += verScore
    
    return Math.round(Math.max(0, Math.min(100, score)))
  },

  getCompatibilityLevel(score: number): string {
    if (score >= 80) return 'Muy Alta'
    if (score >= 60) return 'Alta'
    if (score >= 40) return 'Media'
    return 'Baja'
  }
}
