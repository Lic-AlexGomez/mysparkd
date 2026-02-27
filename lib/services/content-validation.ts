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
    return reportService.getUserReports(contentId).length > 0
  }
}
