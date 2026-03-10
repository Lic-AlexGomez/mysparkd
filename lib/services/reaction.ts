import { api } from '../api'
import type { ReactionType, ReactionTargetType } from '../types'

export const reactionService = {
  async toggleReaction(targetId: string, targetType: ReactionTargetType, reactionType: ReactionType) {
    console.log('toggleReaction llamado:', { targetId, targetType, reactionType });
    console.log('URL que se llamará:', `/api/likes/toggle?targetId=${targetId}&reaction=${reactionType}`);
    
    // El backend usa /api/likes/toggle con query params
    const result = await api.post(`/api/likes/toggle?targetId=${targetId}&reaction=${reactionType}`, {})
    console.log('Resultado de toggleReaction:', result);
    return result;
  },

  async getReactionStatus(targetId: string, targetType: ReactionTargetType) {
    // El backend usa /api/likes/status/{targetId}
    return api.get(`/api/likes/status/${targetId}`)
  },

  async getReactionSummary(targetId: string, targetType: ReactionTargetType) {
    // Por ahora usar el status endpoint
    return api.get(`/api/likes/status/${targetId}`)
  },

  async getUsersByReaction(targetId: string, targetType: ReactionTargetType, reactionType: ReactionType) {
    // Este endpoint probablemente no existe aún, retornar array vacío
    try {
      return api.get(`/api/likes/users/${targetId}?reaction=${reactionType}`)
    } catch {
      return []
    }
  }
}
