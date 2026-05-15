"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

/** Compact promo strip from Feed → Tonight Mode */
export function FeedTonightCta() {
  const { t } = useI18n()
  const features = useFeatureFlags()

  if (!features.tonightPage) return null

  return (
    <Link
      href="/tonight"
      className="group mx-4 mb-3 mt-1 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-r from-primary/15 via-secondary/10 to-transparent px-4 py-3 shadow-[0_0_28px_-8px_rgba(0,229,255,0.35)] transition-[transform,box-shadow] active:scale-[0.99] sm:mx-0 sm:mb-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/40 ring-1 ring-primary/40">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
          </span>
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-bold tracking-tight text-foreground">{t("tonight.feedCta.title")}</p>
          <p className="truncate text-xs text-muted-foreground">{t("tonight.feedCta.subtitle")}</p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
