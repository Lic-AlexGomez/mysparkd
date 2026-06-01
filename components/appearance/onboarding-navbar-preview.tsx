"use client"

import { SparkdNavBar } from "@/components/layout/bottom-nav"
import { getVisualAppearanceUi, type VisualAppearanceId } from "@/lib/appearance/visual-appearances"
import { cn } from "@/lib/utils"

/** Preview del onboarding web: usa la navbar de escritorio, no la móvil. */
export function OnboardingNavbarPreview({ visualId }: { visualId: VisualAppearanceId }) {
  const uiPrefs = getVisualAppearanceUi(visualId)
  const previewPath = uiPrefs.navbarStyle === "gradient" ? "/events" : "/feed"
  const isDock = uiPrefs.navbarStyle === "default" || uiPrefs.navbarStyle === "dock"

  return (
    <div
      className={cn(
        "pointer-events-none overflow-hidden rounded-xl border border-border/50 bg-[#0a0b0f]",
        isDock ? "min-h-[128px] px-2 pb-2 pt-6" : "min-h-16 px-2 py-2"
      )}
    >
      <SparkdNavBar
        visibility="desktop"
        embedded
        previewUiPrefs={uiPrefs}
        previewPathname={previewPath}
      />
    </div>
  )
}
