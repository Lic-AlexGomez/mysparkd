import type { HelpAssistantContext } from "@/lib/help-assistant"
import type { ThemePalette } from "@/lib/theme"
import type { NavbarStyle } from "@/lib/ui-preferences"
import type { VisualAppearanceId } from "@/lib/visual-appearances"

export type SparkyAppearancePatch = {
  skin?: VisualAppearanceId
  palette?: ThemePalette
  navbarStyle?: NavbarStyle
}

export type SparkyAppearanceRecommendation = SparkyAppearancePatch & {
  explanation: string
}

export function buildLocalAppearanceRecommendation(
  ctx: HelpAssistantContext
): SparkyAppearanceRecommendation {
  if (ctx.experienceObjective === "connection" || ctx.isDatingNav) {
    return {
      skin: "discover-cards",
      palette: "ocean",
      explanation:
        "Para modo Conexión, Discover Cards y paleta Océano pueden ayudarte a enfocarte en perfiles y matches.",
    }
  }

  if (ctx.experienceObjective === "social" || ctx.isSocialMode) {
    return {
      skin: "feed-tabs",
      palette: "default",
      explanation:
        "Para modo Social, Feed Tabs o Top Ranking destacan comunidad y actividad en el feed.",
    }
  }

  if (ctx.isBothMode) {
    return {
      skin: "dock-flotante",
      palette: "violet",
      navbarStyle: "dock",
      explanation:
        "En modo Ambos, Dock Flotante con paleta Violeta equilibra feed, eventos y discover.",
    }
  }

  if (ctx.layoutFlags.useCompactEvents || ctx.eventsConfig.layout === "compact") {
    return {
      skin: "eventos-compacto",
      palette: "default",
      explanation: "Eventos Compacto encaja si quieres ver más planes en menos espacio.",
    }
  }

  return {
    skin: "sparkd",
    palette: "default",
    explanation: "Sparkd es un buen equilibrio entre feed, eventos y perfil.",
  }
}
