import { api } from "@/lib/api"

type VerifyEmailCodeInput = {
  code: string
  email?: string
  username?: string
}

type ResendVerificationInput = {
  email?: string
  username?: string
}

async function tryPostCandidates<T>(
  endpoints: Array<{ endpoint: string; body?: Record<string, unknown> }>
): Promise<T> {
  let lastError: unknown = null
  for (const candidate of endpoints) {
    try {
      return await api.post<T>(candidate.endpoint, candidate.body)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No se pudo completar la solicitud")
}

async function tryGetCandidates<T>(endpoints: string[]): Promise<T> {
  let lastError: unknown = null
  for (const endpoint of endpoints) {
    try {
      return await api.get<T>(endpoint)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No se pudo completar la solicitud")
}

export const emailVerificationService = {
  async verifyByCode(input: VerifyEmailCodeInput): Promise<void> {
    const code = input.code.trim()
    const email = input.email?.trim()
    const username = input.username?.trim()

    if (!code) throw new Error("Ingresa el código de verificación")
    if (!email && !username) throw new Error("Ingresa email o usuario para verificar")

    const candidateBodies: Record<string, unknown>[] = []
    if (email) candidateBodies.push({ email, code })
    if (username) candidateBodies.push({ username, code })
    if (email && username) candidateBodies.push({ email, username, code })
    candidateBodies.push({ code })

    const candidates: Array<{ endpoint: string; body?: Record<string, unknown> }> = []
    const endpoints = [
      "/auth/verify-email",
      "/auth/verify-email/code",
      "/auth/verification/confirm",
      "/auth/verify",
      "/auth/confirm-email",
    ]

    for (const endpoint of endpoints) {
      for (const body of candidateBodies) {
        candidates.push({ endpoint, body })
      }
    }

    await tryPostCandidates<void>(candidates)
  },

  async verifyByToken(token: string): Promise<void> {
    const normalized = token.trim()
    if (!normalized) throw new Error("Token de verificación inválido")

    const encoded = encodeURIComponent(normalized)
    try {
      await tryGetCandidates<void>([
        `/auth/verify-email?token=${encoded}`,
        `/auth/verify?token=${encoded}`,
        `/auth/confirm-email?token=${encoded}`,
      ])
      return
    } catch {
      // fallback a endpoints POST
    }

    await tryPostCandidates<void>([
      { endpoint: "/auth/verify-email", body: { token: normalized } },
      { endpoint: "/auth/verify", body: { token: normalized } },
      { endpoint: "/auth/confirm-email", body: { token: normalized } },
    ])
  },

  async resend(input: ResendVerificationInput): Promise<void> {
    const email = input.email?.trim()
    const username = input.username?.trim()
    if (!email && !username) throw new Error("Ingresa email o usuario para reenviar la verificación")

    const payloads: Record<string, unknown>[] = []
    if (email) payloads.push({ email })
    if (username) payloads.push({ username })
    if (email && username) payloads.push({ email, username })

    const endpoints = [
      "/auth/resend-verification-email",
      "/auth/verify-email/resend",
      "/auth/resend-verification",
      "/auth/email/verification/resend",
    ]

    const candidates: Array<{ endpoint: string; body?: Record<string, unknown> }> = []
    for (const endpoint of endpoints) {
      for (const body of payloads) {
        candidates.push({ endpoint, body })
      }
    }

    await tryPostCandidates<void>(candidates)
  },
}

