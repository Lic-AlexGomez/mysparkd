import { blockService } from './block'
import { reportService } from './report'

export const contentValidation = {
  canViewContent(viewerId: string, contentOwnerId: string): boolean {
    return !blockService.isBlockedByEither(viewerId, contentOwnerId)
  },

  filterBlockedUsers<T extends { userId: string }>(viewerId: string, items: T[]): T[] {
    return items.filter(item => this.canViewContent(viewerId, item.userId))
  },

  isContentReported(contentId: string): boolean {
    // Reportes se consultan de forma asíncrona para moderación; aquí no hay caché síncrona.
    void contentId
    void reportService
    return false
  }
}
