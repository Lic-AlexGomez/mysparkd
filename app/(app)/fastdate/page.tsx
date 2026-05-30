"use client"

import { FastDateSection } from "@/components/events/fast-date-section"
import { useI18n } from "@/lib/i18n"
import { Zap } from "lucide-react"

export default function FastDatePage() {
  const { te } = useI18n()

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-4">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">{te("Fast Date", "Fast Date")}</h1>
          <p className="text-sm text-muted-foreground">
            {te(
              "Publica una cita rápida o explora propuestas cerca de ti.",
              "Post a quick date or explore offers near you."
            )}
          </p>
        </div>
      </div>
      <FastDateSection />
    </div>
  )
}
