"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Heart, Link2, Loader2, MapPin, RefreshCw, Sparkles, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useMutualPlansUser } from "@/hooks/use-mutual-plans"
import { useI18n } from "@/lib/i18n"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { Button } from "@/components/ui/button"
import { MutualConnectionRow } from "@/components/mutual-plans/connection-row"
import { MutualSharedPlanCard } from "@/components/mutual-plans/shared-plan-card"

export default function MutualPlansPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { t } = useI18n()
  const features = useFeatureFlags()
  const router = useRouter()
  const userId = user?.userId
  const { data, loading, refresh, total } = useMutualPlansUser(features.mutualPlansPage ? userId : undefined, 90_000)

  useEffect(() => {
    if (!features.mutualPlansPage) router.replace("/feed")
  }, [features.mutualPlansPage, router])

  if (!features.mutualPlansPage) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    )
  }

  return (
    <div className="min-h-svh pb-24 lg:pb-8">
      <div className="border-b border-primary/15 bg-gradient-to-br from-primary/[0.08] via-background to-secondary/[0.06] px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <Link2 className="size-3.5" aria-hidden />
              {t("mutualPlans.badge")}
            </span>
          </div>
          <h1 className="text-balance text-3xl font-black tracking-tight md:text-4xl">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              {t("mutualPlans.pageTitle")}
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            {t("mutualPlans.pageSubtitle")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={loading}
              onClick={() => void refresh()}
            >
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
              {t("mutualPlans.refresh")}
            </Button>
            <Button asChild size="sm" className="gap-2 bg-gradient-to-r from-primary to-secondary text-black">
              <Link href="/events">{t("mutualPlans.browseEvents")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-12 px-4 py-10 md:px-6">
        {authLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
          </div>
        ) : !userId ? (
          <p className="text-center text-sm text-muted-foreground">{t("mutualPlans.loginHint")}</p>
        ) : loading && total === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">{t("mutualPlans.loading")}</p>
          </div>
        ) : total === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary/25 bg-muted/20 px-6 py-14 text-center">
            <Sparkles className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" aria-hidden />
            <p className="text-lg font-semibold">{t("mutualPlans.emptyTitle")}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("mutualPlans.emptyBody")}</p>
            <Button asChild className="mt-6">
              <Link href="/events">{t("mutualPlans.findEvents")}</Link>
            </Button>
          </div>
        ) : null}

        {data && data.goingWithYou.length > 0 ? (
          <section aria-labelledby="mp-going">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-6 text-primary" aria-hidden />
              <h2 id="mp-going" className="text-xl font-bold md:text-2xl">
                {t("mutualPlans.section.goingWithYou")}
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{t("mutualPlans.section.goingWithYouHint")}</p>
            <div className="space-y-3">
              {data.goingWithYou.map((row) => (
                <MutualConnectionRow key={`${row.userId}-${row.eventId}-going`} row={row} t={t} />
              ))}
            </div>
          </section>
        ) : null}

        {data && data.matchesHere.length > 0 ? (
          <section aria-labelledby="mp-matches">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="size-6 text-pink-500" aria-hidden />
              <h2 id="mp-matches" className="text-xl font-bold md:text-2xl">
                {t("mutualPlans.section.matchesHere")}
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{t("mutualPlans.section.matchesHereHint")}</p>
            <div className="space-y-3">
              {data.matchesHere.map((row) => (
                <MutualConnectionRow key={`${row.userId}-${row.eventId}-match`} row={row} t={t} />
              ))}
            </div>
          </section>
        ) : null}

        {data && data.friendsInterested.length > 0 ? (
          <section aria-labelledby="mp-friends">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-6 text-sky-500" aria-hidden />
              <h2 id="mp-friends" className="text-xl font-bold md:text-2xl">
                {t("mutualPlans.section.friendsInterested")}
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{t("mutualPlans.section.friendsInterestedHint")}</p>
            <div className="space-y-3">
              {data.friendsInterested.map((row) => (
                <MutualConnectionRow key={`${row.userId}-${row.eventId}-friend`} row={row} t={t} />
              ))}
            </div>
          </section>
        ) : null}

        {data && data.sharedPlansNearYou.length > 0 ? (
          <section aria-labelledby="mp-shared">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="size-6 text-secondary" aria-hidden />
              <h2 id="mp-shared" className="text-xl font-bold md:text-2xl">
                {t("mutualPlans.section.sharedNearYou")}
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{t("mutualPlans.section.sharedNearYouHint")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.sharedPlansNearYou.map((plan) => (
                <MutualSharedPlanCard key={plan.eventId + (plan.planId || "")} plan={plan} t={t} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
