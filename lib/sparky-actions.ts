import { toast } from "sonner"
import type { VisualAppearanceId } from "@/lib/visual-appearances"
import type { NavbarStyle } from "@/lib/ui-preferences"

export type SparkyAction =
  | { type: "navigate"; route: string }
  | { type: "open_settings"; section?: string }
  | { type: "apply_appearance"; skin?: VisualAppearanceId; palette?: string; navbarStyle?: NavbarStyle }
  | { type: "generate_icebreaker"; targetUserId?: string }
  | { type: "explain_match"; targetUserId?: string }
  | { type: "recommend_event"; eventId?: string }
  | { type: "improve_profile" }
  | { type: "copy_text"; text: string }
  | { type: "dismiss"; nudgeId?: string }

export type SparkyActionHandlers = {
  onGenerateIcebreaker?: (targetUserId?: string) => void
  onExplainMatch?: (targetUserId?: string) => void
  onRecommendEvent?: (eventId?: string) => void
  onImproveProfile?: () => void
  onApplyAppearance?: (patch: {
    skin?: VisualAppearanceId
    palette?: string
    navbarStyle?: NavbarStyle
  }) => void
  onDismissNudge?: (nudgeId?: string) => void
  openSettings?: (section?: string) => void
  navigate?: (route: string) => void
}

export async function executeSparkyAction(
  action: SparkyAction,
  handlers: SparkyActionHandlers = {}
): Promise<boolean> {
  switch (action.type) {
    case "navigate":
      if (handlers.navigate) {
        handlers.navigate(action.route)
        return true
      }
      if (typeof window !== "undefined") window.location.href = action.route
      return true
    case "open_settings":
      handlers.openSettings?.(action.section)
      if (!handlers.openSettings && typeof window !== "undefined") {
        window.location.href = action.section ? `/settings?section=${action.section}` : "/settings"
      }
      return true
    case "apply_appearance":
      handlers.onApplyAppearance?.({
        skin: action.skin,
        palette: action.palette,
        navbarStyle: action.navbarStyle,
      })
      return true
    case "generate_icebreaker":
      handlers.onGenerateIcebreaker?.(action.targetUserId)
      return true
    case "explain_match":
      handlers.onExplainMatch?.(action.targetUserId)
      return true
    case "recommend_event":
      handlers.onRecommendEvent?.(action.eventId)
      return true
    case "improve_profile":
      handlers.onImproveProfile?.()
      return true
    case "copy_text":
      try {
        await navigator.clipboard.writeText(action.text)
        toast.success("Copiado")
      } catch {
        toast.error("No se pudo copiar")
      }
      return true
    case "dismiss":
      handlers.onDismissNudge?.(action.nudgeId)
      return true
    default:
      return false
  }
}
