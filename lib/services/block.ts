import { api } from '@/lib/api'

class BlockService {
  private blockedUsers = new Map<string, Set<string>>()
  private loaded = false

  private async loadBlocks(userId: string) {
    try {
      const blockedIds = await api.get<string[]>(`/api/matches/${userId}/blocks`)
      this.blockedUsers.set(userId, new Set(blockedIds))
    } catch {
      const saved = localStorage.getItem('sparkd_blocks')
      if (saved) {
        const data = JSON.parse(saved)
        if (data[userId]) {
          this.blockedUsers.set(userId, new Set(data[userId]))
        }
      }
    }
    this.loaded = true
  }

  private saveBlocks(userId: string) {
    const blockedIds = Array.from(this.blockedUsers.get(userId) || [])
    const data: Record<string, string[]> = {}
    data[userId] = blockedIds
    localStorage.setItem('sparkd_blocks', JSON.stringify(data))
  }

  async ensureLoaded(userId: string) {
    if (!this.loaded) {
      await this.loadBlocks(userId)
    }
  }

  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    await this.ensureLoaded(blockerId)

    try {
      await api.post(`/api/matches/${blockedId}/block`)
    } catch {
      return false
    }

    if (!this.blockedUsers.has(blockerId)) {
      this.blockedUsers.set(blockerId, new Set())
    }
    this.blockedUsers.get(blockerId)!.add(blockedId)
    this.saveBlocks(blockerId)
    return true
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    await this.ensureLoaded(blockerId)

    try {
      await api.delete(`/api/matches/${blockedId}/block`)
    } catch {
      return false
    }

    this.blockedUsers.get(blockerId)?.delete(blockedId)
    this.saveBlocks(blockerId)
    return true
  }

  isBlocked(userId: string, targetId: string): boolean {
    return this.blockedUsers.get(userId)?.has(targetId) || false
  }

  isBlockedByEither(userId1: string, userId2: string): boolean {
    return this.isBlocked(userId1, userId2) || this.isBlocked(userId2, userId1)
  }
}

export const blockService = new BlockService()