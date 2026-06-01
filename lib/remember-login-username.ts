const REMEMBER_KEY = "sparkd_remember_login_username"
const SAVED_USERNAME_KEY = "sparkd_saved_login_username"

export function loadRememberedLoginUsername(): {
  remember: boolean
  username: string
} {
  if (typeof window === "undefined") return { remember: false, username: "" }
  try {
    const remember = localStorage.getItem(REMEMBER_KEY) === "true"
    const saved = localStorage.getItem(SAVED_USERNAME_KEY) ?? ""
    const username = remember && saved ? saved.replace(/^@/, "").trim() : ""
    return { remember, username }
  } catch {
    return { remember: false, username: "" }
  }
}

export function setRememberLoginUsername(remember: boolean, username?: string): void {
  if (typeof window === "undefined") return
  try {
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, "true")
      const trimmed = username?.trim().replace(/^@/, "") ?? ""
      if (trimmed) localStorage.setItem(SAVED_USERNAME_KEY, trimmed)
    } else {
      localStorage.removeItem(REMEMBER_KEY)
      localStorage.removeItem(SAVED_USERNAME_KEY)
    }
  } catch {
    /* ignore */
  }
}
