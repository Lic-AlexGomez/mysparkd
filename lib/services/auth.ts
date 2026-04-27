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

  /** Agregar o cambiar email de recuperación: envía código al correo indicado. */
  async requestRecoveryEmail(email: string): Promise<void> {
    await api.post("/auth/request-recovery-email", {
      email: email.trim().toLowerCase(),
    })
  },

  async verifyRecoveryEmail(code: string): Promise<void> {
    await api.post("/auth/verify-recovery-email", { code: code.trim() })
  },

  async deleteRecoveryEmail(): Promise<void> {
    await api.delete("/auth/recovery-email")
  },

  /**
   * Promueve el email de recuperación a principal (quita el principal anterior).
   * Requiere tener `recoveryEmail` registrado.
   */
  async deletePrimaryEmail(): Promise<void> {
    await api.delete("/auth/primary-email")
  },
}
