import type { User } from '../types'

type ReputationEvent = 
  | 'post_created' | 'post_liked' | 'comment_added' | 'message_sent'
  | 'message_responded' | 'connection_made' | 'connection_finalized'
  | 'ghosting_detected' | 'report_confirmed' | 'toxic_language'
  | 'spam_detected' | 'verification_completed'

const eventImpacts: Record<ReputationEvent, number> = {
  post_created: 2,
  post_liked: 1,
  comment_added: 1,
  message_sent: 1,
  message_responded: 2,
  connection_made: 3,
  connection_finalized: -5,
  ghosting_detected: -8,
  report_confirmed: -15,
  toxic_language: -10,
  spam_detected: -12,
  verification_completed: 10,
}

export const reputationService = {
  calculateReputation(events: ReputationEvent[]): number {
    const base = 50
    const score = events.reduce((acc, event) => acc + eventImpacts[event], base)
    return Math.max(0, Math.min(100, score))
  },

  getReputationColor(score: number): string {
    if (score >= 90) return '#00e5ff'
    if (score >= 70) return '#d946ef'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  },

  getReputationLevel(score: number): string {
    if (score >= 90) return 'Excelente'
    if (score >= 70) return 'Buena'
    if (score >= 50) return 'Regular'
    return 'Baja'
  }
}
