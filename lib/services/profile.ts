import { api } from '../api'
import type { AdminStats, UserGrowth } from '../types'

export const profileService = {
  async getProfile(userId: string) {
    try {
      return await api.get(`/api/profile/${userId}`)
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  },

  async getProfilePhoto(userId: string): Promise<string | null> {
    try {
      const profile = await api.get<any>(`/api/profile/${userId}`)
      return profile?.profilePictureUrl || profile?.photos?.[0]?.url || null
    } catch {
      return null
    }
  }
}

export const adminService = {
  async getStats(): Promise<AdminStats | null> {
    try {
      return await api.get<AdminStats>('/admin/stats')
    } catch {
      return null
    }
  },

  async getGrowth(): Promise<UserGrowth[]> {
    try {
      return await api.get<UserGrowth[]>('/admin/growth')
    } catch {
      return []
    }
  }
}
