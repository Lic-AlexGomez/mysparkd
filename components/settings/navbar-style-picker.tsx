"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/lib/appearance/appearance-provider"
import { WEB_NAVBAR_STYLE_OPTIONS } from "@/lib/appearance/navbar-style-options"
import type { NavbarStyle } from "@/lib/appearance/types"

export function NavbarStylePicker() {
  const { uiPrefs, setNavbarStyle } = useAppearance()

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {WEB_NAVBAR_STYLE_OPTIONS.map((opt) => {
        const selected = uiPrefs.navbarStyle === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setNavbarStyle(opt.id)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                : "border-border/60 bg-muted/20 hover:border-border"
            )}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">{opt.label}</span>
              {selected ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
            </div>
            <span className="text-xs leading-snug text-muted-foreground">{opt.description}</span>
          </button>
        )
      })}
    </div>
  )
}
