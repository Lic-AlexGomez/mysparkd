"use client"

import { usePathname } from "next/navigation"
import { Zap } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function AppLoadingScreen() {
  const pathname = usePathname()
  const { t } = useI18n()

  const label =
    pathname === "/onboarding"
      ? t("app.loading.onboarding")
      : pathname === "/feed" || pathname?.startsWith("/feed/")
        ? t("app.loading.feed")
        : t("app.loading.default")

  const hint =
    pathname === "/onboarding"
      ? t("app.loading.onboardingHint")
      : t("app.loading.sessionHint")

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <Zap className="h-10 w-10 text-primary animate-pulse" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  )
}
