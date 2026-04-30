"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { usePremiumStatus } from "@/hooks/use-premium-status"
import type { UserProfile, SwipeResponse } from "@/lib/types"
import { SwipeCard } from "@/components/swipes/swipe-card"
import { MatchModal } from "@/components/swipes/match-modal"
import { X, Heart, Loader2, Zap, Crown, RefreshCw } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

const DISCOVER_PAGE_SIZE = 20
/** Alineado con backend free tier (mensaje 429). */
const FREE_DAILY_SWIPE_CAP = 30

export default function SwipesPage() {
  const { user } = useAuth()
  const { isPremium } = usePremiumStatus()
  const { t } = useI18n()
  const router = useRouter()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedUser, setMatchedUser] = useState<{ id: string; name: string } | null>(null)
  const swipedIdsRef = useRef<Set<string>>(new Set())
  const discoverPageRef = useRef(0)
  const hasMoreProfilesRef = useRef(true)
  const isFetchingMoreRef = useRef(false)
  const [hasMoreProfiles, setHasMoreProfiles] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [isSwiping, setIsSwiping] = useState(false)
  const [remainingSwipes, setRemainingSwipes] = useState<number | null>(null)
  const [swipeLimitReached, setSwipeLimitReached] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)

  const mapProfiles = useCallback((rows: any[]) => {
    return rows.map((item: any) => ({
      userId: item.profile.userId,
      nombres: item.profile.nombres,
      apellidos: item.profile.apellidos,
      sex: item.profile.sex,
      dateOfBirth: item.profile.dateOfBirth,
      telefono: item.profile.telefono,
      profileCompleted: item.profile.profileCompleted,
      photos: item.profile.photos || [],
      posts: item.profile.posts || [],
      totalPosts: item.profile.totalPosts || 0,
      compatibilityScore: item.compatibilityScore || 0,
      premium: false,
    })) as UserProfile[]
  }, [])

  const fetchProfiles = useCallback(async (reset = false) => {
    const targetPage = reset ? 0 : discoverPageRef.current + 1
    if (!reset && (!hasMoreProfilesRef.current || isFetchingMoreRef.current)) return

    try {
      if (reset) {
        setIsLoading(true)
        setCurrentIndex(0)
        discoverPageRef.current = 0
      } else {
        isFetchingMoreRef.current = true
        setIsFetchingMore(true)
      }

      const response = await api.get<any>(`/api/discover?page=${targetPage}&size=${DISCOVER_PAGE_SIZE}`)
      const discoverProfiles = Array.isArray(response?.content) ? response.content : []
      const mapped = mapProfiles(discoverProfiles).filter((p) => !swipedIdsRef.current.has(p.userId))

      setProfiles((prev) => {
        const base = reset ? [] : prev
        const seen = new Set(base.map((p) => p.userId))
        const merged = [...base]
        for (const profile of mapped) {
          if (!seen.has(profile.userId)) {
            seen.add(profile.userId)
            merged.push(profile)
          }
        }
        return merged
      })

      const nextPage = typeof response?.number === "number" ? response.number : targetPage
      const totalPages = typeof response?.totalPages === "number" ? response.totalPages : undefined
      const nextHasMore =
        typeof totalPages === "number"
          ? nextPage < totalPages - 1
          : discoverProfiles.length === DISCOVER_PAGE_SIZE

      discoverPageRef.current = nextPage
      hasMoreProfilesRef.current = nextHasMore
      setHasMoreProfiles(nextHasMore)
    } catch {
      if (reset) setProfiles([])
    } finally {
      if (reset) setIsLoading(false)
      isFetchingMoreRef.current = false
      setIsFetchingMore(false)
    }
  }, [mapProfiles])

  const fetchRemainingSwipes = useCallback(async () => {
    if (!user?.userId) return
    if (isPremium) {
      setRemainingSwipes(null)
      setSwipeLimitReached(false)
      return
    }
    try {
      const data = await api.get<{ remainingSwipes?: number; swipesRemaining?: number }>(
        `/api/swipes/remaining/${user.userId}`,
      )
      const raw = data.swipesRemaining ?? data.remainingSwipes
      if (typeof raw === "number") {
        setRemainingSwipes(raw)
        setSwipeLimitReached(raw === 0)
      }
    } catch {
      // Sin contador: el POST de swipe o un 429 actualizará estado
    }
  }, [user?.userId, isPremium])

  useEffect(() => {
    void fetchProfiles(true)
    fetchRemainingSwipes()
  }, [fetchProfiles, fetchRemainingSwipes])

  useEffect(() => {
    const remainingCards = profiles.length - currentIndex - 1
    if (!isLoading && hasMoreProfiles && remainingCards <= 3) {
      void fetchProfiles(false)
    }
  }, [currentIndex, profiles.length, isLoading, hasMoreProfiles, fetchProfiles])

  const swipesUiLocked =
    !isPremium && (swipeLimitReached || (typeof remainingSwipes === "number" && remainingSwipes <= 0))

  const handleSwipe = useCallback(async (direction: "left" | "right") => {
    const currentProfile = profiles[currentIndex]
    if (!currentProfile || isSwiping) return
    if (!isPremium && remainingSwipes !== null && remainingSwipes <= 0) {
      setSwipeLimitReached(true)
      return
    }

    setIsSwiping(true)
    setSwipeDirection(direction)
    const type = direction === "right" ? "LIKE" : "DISLIKE"
    let shouldAdvance = true

    try {
      const response = await api.post<SwipeResponse>("/api/swipes/perform/swipe", {
        targetUserId: currentProfile.userId,
        type,
      })
      if (response.premium) {
        setRemainingSwipes(null)
        setSwipeLimitReached(false)
      } else if (typeof response.swipesRemaining === "number") {
        setRemainingSwipes(response.swipesRemaining)
        setSwipeLimitReached(response.swipesRemaining === 0)
      } else if (!isPremium && remainingSwipes !== null) {
        const next = Math.max(0, remainingSwipes - 1)
        setRemainingSwipes(next)
        setSwipeLimitReached(next === 0)
      } else if (!isPremium && remainingSwipes === null) {
        void fetchRemainingSwipes()
      }
      if (response.match) {
        setMatchedUser({ id: currentProfile.userId, name: `${currentProfile.nombres} ${currentProfile.apellidos}` })
        setShowMatch(true)
      }
      swipedIdsRef.current.add(currentProfile.userId)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(10)
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 429 || error.status === 403)) {
        setSwipeLimitReached(true)
        void fetchRemainingSwipes()
        toast.error(
          error.message ||
            `${t("swipes.limitMessage")} (${FREE_DAILY_SWIPE_CAP})`,
        )
        shouldAdvance = false
      } else {
        shouldAdvance = false
        const msg =
          error instanceof ApiError
            ? error.message
            : "No se pudo registrar el swipe"
        toast.error(msg)
      }
    }

    setTimeout(() => {
      if (shouldAdvance) {
        setCurrentIndex((prev) => prev + 1)
      }
      setSwipeDirection(null)
      setIsSwiping(false)
    }, shouldAdvance ? 200 : 120)
  }, [profiles, currentIndex, isSwiping, isPremium, remainingSwipes, fetchRemainingSwipes])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (swipesUiLocked || isSwiping) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        void handleSwipe("left")
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        void handleSwipe("right")
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleSwipe, swipesUiLocked, isSwiping])

  if (isLoading) {
    return (
      <div className="relative flex h-[80vh] items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-8 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-7 py-6 shadow-xl backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
            <Zap className="relative h-12 w-12 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium text-foreground">{t("swipes.seekingPeople")}</p>
          <p className="text-xs text-muted-foreground">{t("swipes.preparingMatches")}</p>
        </div>
      </div>
    )
  }

  const currentProfile = profiles[currentIndex]
  const nextProfile = profiles[currentIndex + 1]
  const noMoreProfiles = !currentProfile
  const seenCount = Math.min(currentIndex, profiles.length)

  return (
    <div className="relative flex flex-col items-center overflow-hidden bg-background px-4 py-3">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-6 left-4 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
      <div className="relative w-full max-w-sm">

        {/* Header */}
        <div className="mb-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-center sm:gap-3">
            <h1 className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-2xl font-black tracking-tight text-transparent">
              {t("swipes.title")}
            </h1>
            {!isPremium && remainingSwipes !== null && !swipeLimitReached && (
              <Badge variant="secondary" className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                {remainingSwipes} / {FREE_DAILY_SWIPE_CAP} {t("swipes.today")}
              </Badge>
            )}
          </div>
          <p className="mt-1 hidden text-[11px] text-muted-foreground/80 sm:block">
            {t("swipes.tipArrows")}
          </p>
        </div>

        {/* Swipe limit bar */}
        {!isPremium && remainingSwipes !== null && (
          <div className="mb-3 rounded-2xl border border-border/60 bg-card/70 px-3.5 py-3 shadow-md backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-primary" />
                {t("swipes.daily")}
              </span>
              <span className={`text-xs font-bold ${remainingSwipes <= 3 ? 'text-destructive' : 'text-primary'}`}>
                {remainingSwipes}/{FREE_DAILY_SWIPE_CAP}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  remainingSwipes <= 3
                    ? 'bg-destructive'
                    : 'bg-gradient-to-r from-primary to-secondary'
                }`}
                style={{ width: `${Math.min(100, (remainingSwipes / FREE_DAILY_SWIPE_CAP) * 100)}%` }}
              />
            </div>
            {remainingSwipes <= 3 && remainingSwipes > 0 && (
              <button
                onClick={() => router.push('/premium')}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-primary/10 py-1.5 text-center text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                <Crown className="h-3 w-3" /> {t("swipes.getPremiumUnlimited")}
              </button>
            )}
          </div>
        )}

        {/* Card stack */}
        <div className="relative w-full" style={{ height: '390px' }}>
          {swipesUiLocked && !noMoreProfiles && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-end rounded-3xl border border-destructive/20 bg-background/85 backdrop-blur-sm p-4 pb-8 text-center">
              <p className="text-sm font-semibold text-foreground">{t("swipes.noneToday")}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                {t("swipes.limitMessage")}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => router.push("/premium")}
                className="mt-3 bg-gradient-to-r from-primary to-secondary text-black font-bold"
              >
                <Crown className="h-3.5 w-3.5 mr-1" /> {t("nav.premium")}
              </Button>
            </div>
          )}
          {noMoreProfiles ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 rounded-3xl border border-primary/10 bg-gradient-to-br from-card to-muted/30 shadow-xl">
              {hasMoreProfiles || isFetchingMore ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <div className="text-center px-6">
                    <p className="text-lg font-bold text-foreground">{t("swipes.searchingMore")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t("swipes.justMoment")}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
                    <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center">
                      <Zap className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="text-center px-6">
                    <p className="text-xl font-bold text-foreground">{t("swipes.seenAll")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t("swipes.comeBackLater")}</p>
                  </div>
                  <button
                    onClick={() => { void fetchProfiles(true) }}
                    className="flex items-center gap-2 rounded-xl border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    <RefreshCw className="h-4 w-4" /> {t("swipes.reload")}
                  </button>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence initial={false} mode="wait">
              {nextProfile && (
                <SwipeCard
                  key={nextProfile.userId}
                  user={nextProfile}
                  onSwipe={() => {}}
                  isTop={false}
                  compatibility={nextProfile.compatibilityScore}
                  exitDirection={null}
                />
              )}
              {currentProfile && (
                <SwipeCard
                  key={currentProfile.userId}
                  user={currentProfile}
                  onSwipe={handleSwipe}
                  isTop={true}
                  compatibility={currentProfile.compatibilityScore}
                  exitDirection={swipeDirection}
                  swipeEnabled={!swipesUiLocked}
                />
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Action buttons */}
        {!noMoreProfiles && !swipesUiLocked && (
          <div className="mt-4 rounded-2xl border border-border/60 bg-card/70 px-6 py-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
            <button
              onClick={() => void handleSwipe("left")}
              disabled={isSwiping || swipesUiLocked}
              className="group flex h-12 w-12 items-center justify-center rounded-full border-2 border-destructive/30 bg-card shadow-lg transition-all duration-200 hover:scale-110 hover:border-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:hover:scale-100"
              aria-label={t("swipes.pass")}
            >
              <X className="h-6 w-6 text-destructive" />
            </button>

            <button
              onClick={() => void handleSwipe("right")}
              disabled={isSwiping || swipesUiLocked}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-xl shadow-primary/40 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
              aria-label={t("swipes.like")}
            >
              <Heart className="h-8 w-8 text-black fill-black" />
            </button>

            <button
              onClick={() => router.push('/premium')}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-yellow-500/30 bg-card shadow-lg transition-all duration-200 hover:scale-110 hover:border-yellow-500 hover:bg-yellow-500/10"
              title={t("swipes.superLikePremium")}
              aria-label={t("swipes.superLikePremium")}
            >
              <Zap className="h-6 w-6 text-yellow-500" />
            </button>
            </div>
          </div>
        )}

        {!noMoreProfiles && !swipesUiLocked && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t("swipes.swipeButtonsHint")}
          </p>
        )}
      </div>

      <MatchModal
        open={showMatch}
        onOpenChange={setShowMatch}
        matchedUserId={matchedUser?.id}
        matchedUserName={matchedUser?.name}
      />
    </div>
  )
}
