"use client"

import { useState } from "react"
import { Check, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import {
  ONBOARDING_APPEARANCE_OPTIONS,
  THEME_PALETTE_OPTIONS,
  useAppearance,
  type ThemePalette,
  type VisualAppearanceId,
} from "@/lib/appearance/appearance-provider"
import { AppearanceStyleOption } from "./appearance-style-card"
import { OnboardingNavbarPreview } from "./onboarding-navbar-preview"

export function OnboardingAppearanceStep({
  onContinue,
  onBack,
}: {
  onContinue: () => void
  onBack: () => void
}) {
  const { t } = useI18n()
  const { visualAppearance, palette, applyAppearanceChoice } = useAppearance()
  const [selectedVisual, setSelectedVisual] = useState<VisualAppearanceId>(visualAppearance)
  const [selectedPalette, setSelectedPalette] = useState<ThemePalette>(palette)

  const handleSelectVisual = (id: VisualAppearanceId) => {
    setSelectedVisual(id)
    applyAppearanceChoice(id, selectedPalette)
  }

  const handleSelectPalette = (id: ThemePalette) => {
    setSelectedPalette(id)
    applyAppearanceChoice(selectedVisual, id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{t("onboarding.appearance.styleTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("onboarding.appearance.styleHint")}</p>
      </div>

      <OnboardingNavbarPreview visualId={selectedVisual} />

      <div className="flex flex-row gap-2">
        {ONBOARDING_APPEARANCE_OPTIONS.map((opt) => (
          <AppearanceStyleOption
            key={opt.id}
            title={t(opt.labelKey)}
            description={t(opt.descriptionKey)}
            colors={opt.previewColors}
            selected={selectedVisual === opt.id}
            onSelect={() => handleSelectVisual(opt.id)}
          />
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-sm font-medium text-foreground">{t("onboarding.appearance.paletteTitle")}</p>
        </div>
        <p className="text-xs text-muted-foreground">{t("onboarding.appearance.paletteHint")}</p>
        <div className="flex flex-wrap gap-3">
          {THEME_PALETTE_OPTIONS.map((p) => {
            const selected = selectedPalette === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPalette(p.id)}
                title={p.label}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-transform",
                  selected ? "scale-110 ring-2 ring-white shadow-md" : "hover:scale-105"
                )}
                style={{
                  background: `linear-gradient(145deg, ${p.primary}, ${p.secondary})`,
                }}
                aria-pressed={selected}
              >
                {selected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack} className="h-11 flex-1">
          {t("common.back")}
        </Button>
        <Button type="button" onClick={onContinue} className="h-11 flex-[2] bg-primary text-primary-foreground">
          {t("common.continue")}
        </Button>
      </div>
    </div>
  )
}
