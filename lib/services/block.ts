import { api } from '@/lib/api'

class BlockService {
  private blockedUsers = new Map<string, Set<string>>()
  private loaded = new Set<string>()

  private async loadBlocks(userId: string) {
    try {
      const blockedIds = await api.get<string[]>(`/api/matches/${userId}/blocks`)
      this.blockedUsers.set(userId, new Set(blockedIds))
    } catch {
      // Do not rely on localStorage; fallback to empty set if backend isn't available
      this.blockedUsers.set(userId, new Set())
    }
    this.loaded.add(userId)
  }

  private async ensureLoaded(userId: string) {
    if (!this.loaded.has(userId)) {
      await this.loadBlocks(userId)
    }
  }

  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    await this.ensureLoaded(blockerId)

    try {
      await api.post(`/api/matches/${blockerId}/block`, { targetUserId: blockedId })
    } catch {
      return false
    }

    if (!this.blockedUsers.has(blockerId)) {
      this.blockedUsers.set(blockerId, new Set())
    }
    this.blockedUsers.get(blockerId)!.add(blockedId)
    return true
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    await this.ensureLoaded(blockerId)

    try {
      await api.delete(`/api/matches/${blockerId}/block/${blockedId}`)
    } catch {
      return false
    }

    this.blockedUsers.get(blockerId)?.delete(blockedId)
    return true
  }

  async listBlockedUserIds(userId: string): Promise<string[]> {
    await this.ensureLoaded(userId)
    return [...(this.blockedUsers.get(userId) ?? [])]
  }

  isBlocked(userId: string, targetId: string): boolean {
    return this.blockedUsers.get(userId)?.has(targetId) || false
  }

  isBlockedByEither(userId1: string, userId2: string): boolean {
    return this.isBlocked(userId1, userId2) || this.isBlocked(userId2, userId1)
  }
}

export const blockService = new BlockService()
