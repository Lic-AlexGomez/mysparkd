"use client"

import { Palette } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useVisualAppearance } from "@/components/theme/visual-appearance-provider"
import { cn } from "@/lib/utils"
import type { VisualAppearanceId } from "@/lib/visual-appearances"

export function AppearanceSettingsSection() {
  const { visualAppearanceId, setVisualAppearanceId, options } = useVisualAppearance()

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5 text-primary" />
          Apariencia visual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Skins de la app — mismos looks que en móvil. Sparkd es el tema original.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setVisualAppearanceId(opt.id as VisualAppearanceId)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all hover:border-primary/50",
                visualAppearanceId === opt.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border"
              )}
            >
              <div className="mb-2 flex gap-1">
                {opt.previewColors.map((c) => (
                  <span
                    key={c}
                    className="h-4 w-4 rounded-full border border-white/20"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="text-xs font-bold text-foreground">{opt.label}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">{opt.description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
