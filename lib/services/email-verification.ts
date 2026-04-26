import { api } from "@/lib/api"

import type { AccountType } from "@/lib/types"

type VerifyEmailResponse = {
  token: string
  accountType?: AccountType | string
}

type VerifyEmailCodeInput = {
  code: string
  email: string
}

type ResendVerificationInput = {
  email: string
}

export const emailVerificationService = {
  async verifyByCode(input: VerifyEmailCodeInput): Promise<VerifyEmailResponse> {
    const code = input.code.trim()
    const email = input.email.trim().toLowerCase()

    if (!code) throw new Error("Ingresa el código de verificación")
    if (!email) throw new Error("Ingresa tu email")
    return await api.post<VerifyEmailResponse>("/auth/verify-email", { email, code })
  },

  async resend(input: ResendVerificationInput): Promise<void> {
    const email = input.email.trim().toLowerCase()
    if (!email) throw new Error("Ingresa tu email para reenviar la verificación")
    await api.post("/auth/resend-verification", { email })
  },
}

