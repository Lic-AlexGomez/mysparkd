import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser"
import { api } from "@/lib/api"

export type PasskeyRecord = {
  id: number
  deviceName: string
  createdAt: string
}

const STORAGE_USER_ID = "sparkd_user_id"
const STORAGE_USERNAME = "sparkd_username"

export function isPasskeySupported(): boolean {
  return typeof window !== "undefined" && browserSupportsWebAuthn()
}

/** Passkeys requieren rpId mysparkd.com (producción) o localhost en dev con backend configurado. */
export function isPasskeyHostAllowed(): boolean {
  if (typeof window === "undefined") return false
  const h = window.location.hostname
  return (
    h === "www.mysparkd.com" ||
    h === "mysparkd.com" ||
    h === "localhost" ||
    h === "127.0.0.1"
  )
}

function deviceLabel(): string {
  if (typeof navigator === "undefined") return "Navegador"
  const ua = navigator.userAgent
  if (/iPhone|iPad/i.test(ua)) return "iPhone / iPad"
  if (/Android/i.test(ua)) return "Android"
  if (/Mac/i.test(ua)) return "Mac"
  if (/Windows/i.test(ua)) return "Windows"
  return "Navegador"
}

export async function resolveUserIdByUsername(username: string): Promise<string | null> {
  const trimmed = username.trim()
  if (!trimmed) return null

  const storedId = localStorage.getItem(STORAGE_USER_ID)
  const storedName = localStorage.getItem(STORAGE_USERNAME)
  if (storedId && storedName?.toLowerCase() === trimmed.toLowerCase()) {
    return storedId
  }

  try {
    const res = await api.post<{ userId?: string }>("/auth/passkeys/resolve-username", {
      username: trimmed,
    })
    return res.userId ? String(res.userId) : null
  } catch {
    return null
  }
}

export async function registerPasskey(params: {
  userId: string
  username: string
  displayName?: string
  deviceName?: string
}): Promise<void> {
  const options = await api.post<Record<string, unknown>>(
    "/auth/passkeys/register/options",
    {
      userId: params.userId,
      username: params.username,
      displayName: params.displayName ?? params.username,
    }
  )

  const attResp = await startRegistration({
    optionsJSON: options as unknown as Parameters<
      typeof startRegistration
    >[0]["optionsJSON"],
  })

  await api.post(
    `/auth/passkeys/register/verify?userId=${encodeURIComponent(params.userId)}`,
    {
      ...attResp,
      deviceName: params.deviceName ?? deviceLabel(),
    }
  )
}

export async function loginWithPasskey(username: string): Promise<string> {
  const userId = await resolveUserIdByUsername(username)
  if (!userId) {
    throw new Error(
      "No encontramos ese usuario. Verifica el nombre de usuario (sin @) o regístrate primero."
    )
  }

  let options: Record<string, unknown>
  try {
    options = await api.post<Record<string, unknown>>(
      "/auth/passkeys/login/options",
      { userId }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("404") || msg.toLowerCase().includes("passkey")) {
      throw new Error("Este usuario no tiene passkeys registradas.")
    }
    throw e
  }

  const authResp = await startAuthentication({
    optionsJSON: options as unknown as Parameters<
      typeof startAuthentication
    >[0]["optionsJSON"],
  })

  const result = await api.post<{ token?: string }>(
    `/auth/passkeys/login/verify?userId=${encodeURIComponent(userId)}`,
    authResp
  )

  const token = result.token?.trim()
  if (!token) throw new Error("El servidor no devolvió un token de sesión.")

  localStorage.setItem(STORAGE_USER_ID, userId)
  localStorage.setItem(STORAGE_USERNAME, username.trim())
  return token
}

export async function listPasskeys(): Promise<PasskeyRecord[]> {
  const rows = await api.get<PasskeyRecord[]>("/auth/passkeys/me")
  return Array.isArray(rows) ? rows : []
}

export async function deletePasskey(passkeyId: number): Promise<void> {
  await api.delete(`/auth/passkeys/${passkeyId}`)
}
