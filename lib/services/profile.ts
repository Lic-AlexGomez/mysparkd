import { api } from '../api'

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
      return profile?.photoUrl || profile?.profilePhoto || null
    } catch (error) {
      return null
    }
  }
}
