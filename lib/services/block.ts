import { api } from '@/lib/api'

export type BlockedUserRow = {
  userId: string
  username?: string
  profilePictureUrl?: string
  blockedAt?: string
}

type BlockToggleResponse = { blocked?: boolean }

function normalizeBlockedRow(raw: Record<string, unknown>): BlockedUserRow {
  return {
    userId: String(raw.userId ?? raw.id ?? ""),
    username: typeof raw.username === "string" ? raw.username : undefined,
    profilePictureUrl:
      typeof raw.profilePictureUrl === "string" ? raw.profilePictureUrl : undefined,
    blockedAt: typeof raw.blockedAt === "string" ? raw.blockedAt : undefined,
  }
}

/** Backend: POST /api/users/{userId}/block (toggle); GET /api/users/blocked */
class BlockService {
  private blockedUsers = new Map<string, Set<string>>()
  private loaded = new Set<string>()

  private async loadBlocks(userId: string) {
    try {
      const rows = await api.get<unknown>("/api/users/blocked")
      const ids = Array.isArray(rows)
        ? rows.map((r) => String((r as Record<string, unknown>).userId ?? "")).filter(Boolean)
        : []
      this.blockedUsers.set(userId, new Set(ids))
    } catch {
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
      const res = await api.post<BlockToggleResponse>(`/api/users/${blockedId}/block`)
      if (res?.blocked === true) {
        if (!this.blockedUsers.has(blockerId)) {
          this.blockedUsers.set(blockerId, new Set())
        }
        this.blockedUsers.get(blockerId)!.add(blockedId)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    await this.ensureLoaded(blockerId)
    try {
      const res = await api.post<BlockToggleResponse>(`/api/users/${blockedId}/block`)
      if (res?.blocked === false) {
        this.blockedUsers.get(blockerId)?.delete(blockedId)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async listBlockedUserIds(userId: string): Promise<string[]> {
    await this.ensureLoaded(userId)
    return [...(this.blockedUsers.get(userId) ?? [])]
  }

  async listBlockedUsers(): Promise<BlockedUserRow[]> {
    try {
      const rows = await api.get<unknown>("/api/users/blocked")
      if (!Array.isArray(rows)) return []
      return rows
        .map((r) => normalizeBlockedRow(r as Record<string, unknown>))
        .filter((r) => r.userId)
    } catch {
      return []
    }
  }

  isBlocked(userId: string, targetId: string): boolean {
    return this.blockedUsers.get(userId)?.has(targetId) || false
  }

  isBlockedByEither(userId1: string, userId2: string): boolean {
    return this.isBlocked(userId1, userId2) || this.isBlocked(userId2, userId1)
  }
}

export const blockService = new BlockService()
