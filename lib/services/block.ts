class BlockService {
  private blockedUsers = new Map<string, Set<string>>()

  constructor() {
    this.loadBlocks()
  }

  private loadBlocks() {
    const saved = localStorage.getItem('sparkd_blocks')
    if (saved) {
      const data = JSON.parse(saved)
      Object.entries(data).forEach(([userId, blockedIds]) => {
        this.blockedUsers.set(userId, new Set(blockedIds as string[]))
      })
    }
  }

  private saveBlocks() {
    const data: Record<string, string[]> = {}
    this.blockedUsers.forEach((blockedIds, userId) => {
      data[userId] = Array.from(blockedIds)
    })
    localStorage.setItem('sparkd_blocks', JSON.stringify(data))
  }

  blockUser(blockerId: string, blockedId: string) {
    if (!this.blockedUsers.has(blockerId)) {
      this.blockedUsers.set(blockerId, new Set())
    }
    this.blockedUsers.get(blockerId)!.add(blockedId)
    this.saveBlocks()
  }

  unblockUser(blockerId: string, blockedId: string) {
    this.blockedUsers.get(blockerId)?.delete(blockedId)
    this.saveBlocks()
  }

  isBlocked(userId: string, targetId: string): boolean {
    return this.blockedUsers.get(userId)?.has(targetId) || false
  }

  isBlockedByEither(userId1: string, userId2: string): boolean {
    return this.isBlocked(userId1, userId2) || this.isBlocked(userId2, userId1)
  }
}

export const blockService = new BlockService()
