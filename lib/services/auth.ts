import { api } from '../api'

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const authService = {
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.post('/auth/change-password', payload)
  },

  /**
   * Solicita cambio de email principal. El backend envía un código al nuevo correo;
   * confirmar con `POST /auth/verify-email-change` (Cuerpo: `{ code }`).
   */
  async requestEmailChange(email: string): Promise<void> {
    await api.post("/auth/request-email-change", {
      email: email.trim().toLowerCase(),
    })
  },

  async verifyEmailChange(code: string): Promise<void> {
    await api.post("/auth/verify-email-change", { code: code.trim() })
  },
}
