import { api } from '../api'
import { toBackendAccountType } from '../account-type'
import {
  contextHeaders,
  contextQuery,
  redactProfileForDatingContext,
  type ProfileFetchOptions,
  type SparkdViewerContext,
} from '../dm-eligibility'
import type { UpdateProfileRequest, UserProfile } from '../types'

export const profileService = {
  async getProfile(userId: string, options?: ProfileFetchOptions): Promise<UserProfile | null> {
    const context: SparkdViewerContext = options?.context ?? "SOCIAL"
    try {
      const profile = await api.get<UserProfile>(
        `/api/profile/${encodeURIComponent(userId)}?${contextQuery(context)}`,
        { headers: contextHeaders(context) }
      )
      return redactProfileForDatingContext(profile, context)
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  },

  async getProfilePhoto(userId: string, options?: ProfileFetchOptions): Promise<string | null> {
    const context: SparkdViewerContext = options?.context ?? "SOCIAL"
    try {
      const profile = await api.get<any>(
        `/api/profile/${encodeURIComponent(userId)}?${contextQuery(context)}`,
        { headers: contextHeaders(context) }
      )
      return profile?.profilePictureUrl || profile?.photos?.[0]?.url || null
    } catch {
      return null
    }
  },

  /** PUT /api/profile — cuerpo completo según contrato backend (username, accountType, etc.). */
  async updateMyProfile(body: UpdateProfileRequest): Promise<void> {
    const accountType = toBackendAccountType(body.accountType)
    await api.put("/api/profile", { ...body, accountType })
  },
}
