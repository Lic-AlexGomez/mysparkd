import { api } from "@/lib/api"

/** Web push / FCM device token sync with backend profile. */
export const pushTokenService = {
  async register(token: string): Promise<boolean> {
    const trimmed = token?.trim()
    if (!trimmed) return false
    try {
      await api.put("/api/profile/fcm-token", { token: trimmed })
      return true
    } catch {
      return false
    }
  },

  async unregister(): Promise<void> {
    try {
      await api.delete("/api/profile/fcm-token")
    } catch {
      // ignore — logout should proceed
    }
  },
}
