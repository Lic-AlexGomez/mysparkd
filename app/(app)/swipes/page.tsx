"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { usePremiumStatus } from "@/hooks/use-premium-status"
import type { UserProfile, SwipeResponse } from "@/lib/types"
import { SwipeCard } from "@/components/swipes/swipe-card"
import { MatchModal } from "@/components/swipes/match-modal"
import { X, Heart, Loader2, Zap, Crown, AlertCircle, RefreshCw } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function SwipesPage() {
  const { user } = useAuth()
  const { isPremium } = usePremiumStatus()
  const router = useRouter()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedUser, setMatchedUser] = useState<{ id: string; name: string } | null>(null)
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set())
  const [remainingSwipes, setRemainingSwipes] = useState<number | null>(null)
  const [swipeLimitReached, setSwipeLimitReached] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await api.get<any>("/api/discover?page=0&size=20")
      const discoverProfiles = response.content || []
      const mapped = discoverProfiles
        .map((item: any) => ({
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
        }))
      setProfiles(mapped)
    } catch {
      setProfiles([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchRemainingSwipes = useCallback(async () => {
    if (!user?.userId || isPremium) { setRemainingSwipes(null); return }
    try {
      const data = await api.get<{ remainingSwipes: number }>(`/api/swipes/remaining/${user.userId}`)
      setRemainingSwipes(data.remainingSwipes)
      setSwipeLimitReached(data.remainingSwipes === 0)
    } catch {}
  }, [user?.userId, isPremium])

  useEffect(() => {
    fetchProfiles()
    fetchRemainingSwipes()
  }, [fetchProfiles, fetchRemainingSwipes])

  const handleSwipe = async (direction: "left" | "right") => {
    const currentProfile = profiles[currentIndex]
    if (!currentProfile) return
    if (!isPremium && remainingSwipes !== null && remainingSwipes <= 0) {
      setSwipeLimitReached(true)
      return
    }

    setSwipeDirection(direction)
    const type = direction === "right" ? "LIKE" : "DISLIKE"

    try {
      const response = await api.post<SwipeResponse>("/api/swipes/perform/swipe", {
        targetUserId: currentProfile.userId,
        type,
      })
      if (response.match) {
        setMatchedUser({ id: currentProfile.userId, name: `${currentProfile.nombres} ${currentProfile.apellidos}` })
        setShowMatch(true)
      }
      setSwipedIds(prev => new Set(prev).add(currentProfile.userId))
      if (!isPremium && remainingSwipes !== null) {
        setRemainingSwipes(prev => prev !== null ? prev - 1 : null)
      }
    } catch (error: any) {
      if (error.message?.includes('Límite') || error.message?.includes('limit')) {
        setSwipeLimitReached(true)
        fetchRemainingSwipes()
      }
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 200)
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-primary/40 rounded-full animate-pulse" />
            <Zap className="h-12 w-12 text-primary relative animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Buscando personas...</p>
        </div>
      </div>
    )
  }

  const currentProfile = profiles[currentIndex]
  const nextProfile = profiles[currentIndex + 1]
  const noMoreProfiles = !currentProfile

  return (
    <div className="flex flex-col items-center bg-background px-4 py-3">
      <div className="w-full max-w-sm">

        {/* Header - solo desktop */}
        <div className="mb-3 text-center hidden lg:block">
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Descubrir
          </h1>
          {!noMoreProfiles && (
            <p className="text-xs text-muted-foreground">
              {profiles.length - currentIndex} personas cerca de ti
            </p>
          )}
        </div>

        {/* Swipe limit bar */}
        {!isPremium && remainingSwipes !== null && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-primary" />
                Swipes hoy
              </span>
              <span className={`text-xs font-bold ${remainingSwipes <= 3 ? 'text-destructive' : 'text-primary'}`}>
                {remainingSwipes}/10
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  remainingSwipes <= 3
                    ? 'bg-destructive'
                    : 'bg-gradient-to-r from-primary to-secondary'
                }`}
                style={{ width: `${(remainingSwipes / 10) * 100}%` }}
              />
            </div>
            {remainingSwipes <= 3 && remainingSwipes > 0 && (
              <button
                onClick={() => router.push('/premium')}
                className="mt-2 w-full text-xs text-center text-primary hover:underline flex items-center justify-center gap-1"
              >
                <Crown className="h-3 w-3" /> Obtén swipes ilimitados con Premium
              </button>
            )}
          </div>
        )}

        {/* Limit reached */}
        {swipeLimitReached && (
          <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Límite alcanzado</p>
                <p className="text-xs text-muted-foreground mt-0.5">Vuelve mañana o hazte Premium</p>
                <button
                  onClick={() => router.push('/premium')}
                  className="mt-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-primary to-secondary text-black flex items-center gap-1"
                >
                  <Crown className="h-3 w-3" /> Premium
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card stack */}
        <div className="relative w-full" style={{ height: '380px' }}>
          {noMoreProfiles ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 rounded-3xl bg-gradient-to-br from-card to-muted/30 border border-primary/10">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="text-center px-6">
                <p className="text-xl font-bold text-foreground">¡Has visto a todos!</p>
                <p className="text-sm text-muted-foreground mt-1">Vuelve más tarde para ver nuevas personas</p>
              </div>
              <button
                onClick={() => { setCurrentIndex(0); fetchProfiles() }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Recargar
              </button>
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
                />
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Action buttons */}
        {!noMoreProfiles && !swipeLimitReached && (
          <div className="mt-5 flex items-center justify-between px-8">
            <button
              onClick={() => handleSwipe("left")}
              className="group h-12 w-12 rounded-full bg-card border-2 border-destructive/30 hover:border-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-110 shadow-lg flex items-center justify-center"
            >
              <X className="h-6 w-6 text-destructive" />
            </button>

            <button
              onClick={() => handleSwipe("right")}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-xl shadow-primary/40 hover:scale-110 transition-all duration-200 flex items-center justify-center"
            >
              <Heart className="h-8 w-8 text-black fill-black" />
            </button>

            <button
              onClick={() => router.push('/premium')}
              className="h-12 w-12 rounded-full bg-card border-2 border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all duration-200 hover:scale-110 shadow-lg flex items-center justify-center"
              title="Super Like (Premium)"
            >
              <Zap className="h-6 w-6 text-yellow-500" />
            </button>
          </div>
        )}

        {!noMoreProfiles && !swipeLimitReached && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Desliza ← para pasar · → para dar like
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
