import { api } from '../api'
import type { ReactionType, ReactionTargetType } from '../types'

export const reactionService = {
  async toggleReaction(targetId: string, targetType: ReactionTargetType, reactionType: ReactionType) {
    return api.post('/api/reactions/toggle', {
      targetId,
      targetType,
      reactionType
    })
  },

  async getReactionStatus(targetId: string, targetType: ReactionTargetType) {
    return api.get(`/api/reactions/status/${targetId}?targetType=${targetType}`)
  },

  async getReactionSummary(targetId: string, targetType: ReactionTargetType) {
    return api.get(`/api/reactions/summary/${targetId}?targetType=${targetType}`)
  },

  async getUsersByReaction(targetId: string, targetType: ReactionTargetType, reactionType: ReactionType) {
    return api.get(`/api/reactions/users/${targetId}?targetType=${targetType}&reactionType=${reactionType}`)
  }
}
