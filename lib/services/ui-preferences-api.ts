import { api } from "@/lib/api"
import type { UiPreferences } from "@/lib/appearance/types"
import { DEFAULT_UI_PREFERENCES } from "@/lib/appearance/types"

export type BackendUiPreferences = {
  navbarStyle?: string
  hiddenElements?: Record<string, boolean>
  tabOrder?: string[]
}

export function uiPrefsToBackend(prefs: UiPreferences): BackendUiPreferences {
  return {
    navbarStyle: prefs.navbarStyle,
    hiddenElements: {
      hideLiveIndicator: prefs.hideLiveIndicator === true,
      hideLabels: prefs.showLabels === false,
    },
  }
}

export function uiPrefsFromBackend(raw: BackendUiPreferences | null): Partial<UiPreferences> {
  if (!raw) return {}
  const partial: Partial<UiPreferences> = {}
  if (typeof raw.navbarStyle === "string" && raw.navbarStyle.trim()) {
    partial.navbarStyle = raw.navbarStyle as UiPreferences["navbarStyle"]
  }
  const hidden = raw.hiddenElements
  if (hidden && typeof hidden === "object") {
    if (hidden.hideLiveIndicator === true) partial.hideLiveIndicator = true
    if (hidden.hideLabels === true) partial.showLabels = false
  }
  return partial
}

export const uiPreferencesApi = {
  async fetchRemote(): Promise<Partial<UiPreferences> | null> {
    try {
      const data = await api.get<BackendUiPreferences>("/api/preferences/ui")
      const partial = uiPrefsFromBackend(data)
      return Object.keys(partial).length > 0 ? partial : null
    } catch {
      return null
    }
  },

  async saveRemote(prefs: UiPreferences): Promise<void> {
    try {
      await api.put("/api/preferences/ui", uiPrefsToBackend(prefs))
    } catch {
      /* offline */
    }
  },

  mergeRemote(local: UiPreferences, remote: Partial<UiPreferences> | null): UiPreferences {
    if (!remote) return local
    return { ...DEFAULT_UI_PREFERENCES, ...local, ...remote }
  },
}
