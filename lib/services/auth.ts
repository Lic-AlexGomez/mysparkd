import { api } from '../api'

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const authService = {
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.post('/auth/change-password', payload)
  },
}
