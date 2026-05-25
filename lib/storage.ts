/** Persistencia web (localStorage) — mismas claves que la app móvil. */

export const STORAGE_KEYS = {
  token: "sparkd_token",
  userId: "sparkd_user_id",
  username: "sparkd_username",
  user: "sparkd_user",
  loginAccountType: "sparkd_login_account_type",
  helpAssistantSettings: "sparkd_help_assistant_settings",
  sparkyMemory: "sparkd_sparky_memory",
  sparkyLocalHistory: "sparkd_sparky_local_history",
  uiPreferences: "sparkd_ui_preferences",
} as const

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem(key)
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") return
    window.localStorage.setItem(key, value)
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(key)
  },
}
