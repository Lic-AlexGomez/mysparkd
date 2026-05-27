"use client"

import { usePathname } from "next/navigation"
import { useAppearanceOptional } from "@/lib/appearance/appearance-provider"
import { DEFAULT_UI_PREFERENCES } from "@/lib/appearance/types"
import { useExperienceMode } from "@/hooks/use-experience-mode"
import { ClassicFlatNav } from "./classic-flat-nav"
import { DatingTabNav } from "./dating-tab-nav"
import { SparkdNavBar } from "./bottom-nav"

/**
 * Capa de navegación inferior web:
 * - default / gradient / glass / dock → Sparkd dock (móvil + escritorio)
 * - flat → barra plana del mockup (Feed, Events, Groups…)
 * - dating-tabs → pestañas dating del mockup (Discover, Likes…)
 */
export function WebBottomNav() {
  const pathname = usePathname()
  const mode = useExperienceMode()
  const uiPrefs = useAppearanceOptional()?.uiPrefs ?? DEFAULT_UI_PREFERENCES
  const style = uiPrefs.navbarStyle

  if (pathname.startsWith("/chat/")) return null

  if (style === "dating-tabs") {
    return <DatingTabNav />
  }

  if (style === "flat") {
    const variant = mode === "SOCIAL" ? "social" : "full"
    return <ClassicFlatNav variant={variant} />
  }

  return (
    <>
      <SparkdNavBar visibility="mobile" />
      <SparkdNavBar visibility="desktop" />
    </>
  )
}
