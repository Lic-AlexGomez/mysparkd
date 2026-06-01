import { api } from "../api"
import type { DatingExposureSource } from "../contact-permissions"

export type CanMessageResponse = {
  allowed: boolean
  reason: string
  message?: string
}

export type ContactContextResponse = {
  hasActiveMatch: boolean
  isBlocked: boolean
  senderFollowsReceiver: boolean
  receiverFollowsSender: boolean
  senderFollowCreatedAt?: string | null
  receiverFollowCreatedAt?: string | null
  datingExposure?: {
    firstSeenAt: string
    source: DatingExposureSource
    status: string
  } | null
  receiverWhoCanSendDM?: "EVERYONE" | "FOLLOWERS" | "MATCHES"
  hideFromSocialSearch?: boolean
  canMessage?: boolean
  canFollow?: boolean
}

export const contactPermissionsService = {
  /** Registra que el viewer vio al usuario en dating (idempotente en backend). */
  async recordDatingExposure(viewedUserId: string, source: DatingExposureSource): Promise<void> {
    try {
      await api.post<void>("/api/dating/exposure", { viewedUserId, source })
    } catch {
      // Backend puede no existir aún; no bloquear UX
    }
  },

  async getCanMessage(targetUserId: string): Promise<CanMessageResponse | null> {
    try {
      return await api.get<CanMessageResponse>(
        `/api/contact-permissions/can-message/${encodeURIComponent(targetUserId)}`
      )
    } catch {
      return null
    }
  },

  async getContactContext(targetUserId: string): Promise<ContactContextResponse | null> {
    try {
      return await api.get<ContactContextResponse>(
        `/api/contact-permissions/context/${encodeURIComponent(targetUserId)}`
      )
    } catch {
      return null
    }
  },
}
