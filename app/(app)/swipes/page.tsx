"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { compatibilityService } from "@/lib/services/compatibility"
import { reputationService } from "@/lib/services/reputation"
import { matchService } from "@/lib/services/match"
import { useAuth } from "@/lib/auth-context"
import { usePremiumStatus } from "@/hooks/use-premium-status"
import type { UserProfile, SwipeResponse } from "@/lib/types"
import { SwipeCard } from "@/components/swipes/swipe-card"
import { MatchModal } from "@/components/swipes/match-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Heart, Loader2, Zap, Eye, Crown, AlertCircle } from "lucide-react"
import { AnimatePresence } from "framer-motion"

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

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await api.get<any>("/api/discover?page=0&size=20")
      const discoverProfiles = response.content || []
      
      const profiles = discoverProfiles
        .filter((item: any) => !swipedIds.has(item.profile.userId))
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
          compatibilityScore: item.compatibilityScore || 0
        }))
      
      setProfiles(profiles)
    } catch (error: any) {
      // Silenciar errores 403 (sin permisos) y otros errores del servidor
      // El usuario verá "No hay más perfiles" en lugar de un error
      setProfiles([])
    } finally {
      setIsLoading(false)
    }
  }, [swipedIds])

  const fetchRemainingSwipes = useCallback(async () => {
    if (!user?.userId || isPremium) {
      setRemainingSwipes(null)
      return
    }
    
    try {
      const data = await api.get<{ remainingSwipes: number }>(`/api/swipes/remaining/${user.userId}`)
      setRemainingSwipes(data.remainingSwipes)
      setSwipeLimitReached(data.remainingSwipes === 0)
    } catch (error) {
      console.error('Error fetching remaining swipes:', error)
    }
  }, [user?.userId, isPremium])

  useEffect(() => {
    fetchProfiles()
    fetchRemainingSwipes()
  }, [fetchProfiles, fetchRemainingSwipes])

  const handleSwipe = async (direction: "left" | "right") => {
    const currentProfile = profiles[currentIndex]
    if (!currentProfile) return

    // Verificar límite de swipes
    if (!isPremium && remainingSwipes !== null && remainingSwipes <= 0) {
      setSwipeLimitReached(true)
      return
    }

    const type = direction === "right" ? "LIKE" : "DISLIKE"

    try {
      const response = await api.post<SwipeResponse>("/api/swipes/perform/swipe", {
        targetUserId: currentProfile.userId,
        type,
      })

      console.log('Swipe response:', response)

      if (response.match) {
        setMatchedUser({
          id: currentProfile.userId,
          name: `${currentProfile.nombres} ${currentProfile.apellidos}`,
        })
        setShowMatch(true)
      }
      
      setSwipedIds(prev => new Set(prev).add(currentProfile.userId))
      
      // Actualizar swipes restantes
      if (!isPremium && remainingSwipes !== null) {
        setRemainingSwipes(prev => prev !== null ? prev - 1 : null)
      }
    } catch (error: any) {
      console.error('Error en swipe:', error)
      
      // Verificar si es error de límite
      if (error.message?.includes('Límite') || error.message?.includes('limit')) {
        setSwipeLimitReached(true)
        fetchRemainingSwipes()
      }
    }

    setCurrentIndex((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentProfile = profiles[currentIndex]
  const nextProfile = profiles[currentIndex + 1]
  const noMoreProfiles = !currentProfile

  return (
    <div className="flex justify-center min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md px-4 py-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Descubrir</h1>
          <p className="text-sm text-muted-foreground mt-1">{profiles.length - currentIndex} perfiles disponibles</p>
        </div>

        {/* Indicador de swipes restantes */}
        {!isPremium && remainingSwipes !== null && (
          <div className={`mb-4 p-4 rounded-lg border ${
            remainingSwipes === 0 
              ? 'bg-destructive/10 border-destructive/30' 
              : remainingSwipes <= 3
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-primary/10 border-primary/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`h-5 w-5 ${
                  remainingSwipes === 0 ? 'text-destructive' : 'text-primary'
                }`} />
                <span className="font-medium text-foreground">
                  Swipes restantes hoy: {remainingSwipes}/10
                </span>
              </div>
              {remainingSwipes <= 3 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-black"
                  onClick={() => router.push('/premium')}
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Premium
                </Button>
              )}
            </div>
            {remainingSwipes === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Se reseteará a medianoche. ¡Obtén Premium para swipes ilimitados!
              </p>
            )}
          </div>
        )}

        {/* Banner de límite alcanzado */}
        {swipeLimitReached && (
          <div className="mb-4 p-4 bg-gradient-to-r from-destructive/10 to-yellow-500/10 border border-destructive/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Límite de swipes alcanzado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Has usado tus 10 swipes diarios. Vuelve mañana o actualiza a Premium para swipes ilimitados.
                </p>
                <Button 
                  size="sm" 
                  className="mt-2 bg-gradient-to-r from-primary to-secondary text-black"
                  onClick={() => router.push('/premium')}
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Obtener Premium
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Card stack */}
        <div className="relative h-[60vh] w-full max-h-[500px]">
          {noMoreProfiles ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-primary/10">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full" />
                <Zap className="h-20 w-20 text-primary relative" />
              </div>
              <p className="text-xl font-bold">
                No hay más perfiles
              </p>
              <p className="text-sm text-muted-foreground text-center px-8">
                Vuelve más tarde para ver nuevas personas
              </p>
            </div>
          ) : (
          <AnimatePresence>
            {nextProfile && (
              <SwipeCard
                key={nextProfile.userId}
                user={nextProfile}
                onSwipe={() => {}}
                isTop={false}
                compatibility={nextProfile.compatibilityScore}
              />
            )}
            {currentProfile && (
              <SwipeCard
                key={currentProfile.userId}
                user={currentProfile}
                onSwipe={handleSwipe}
                isTop={true}
                compatibility={currentProfile.compatibilityScore}
              />
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Action buttons */}
      {!noMoreProfiles && !swipeLimitReached && (
        <div className="mt-6 flex items-center justify-center gap-6">
          <Button
            size="icon"
            onClick={() => handleSwipe("left")}
            className="h-16 w-16 rounded-full bg-gradient-to-br from-muted to-muted/50 text-destructive hover:scale-110 transition-transform shadow-lg border-2 border-destructive/20"
          >
            <X className="h-7 w-7" />
            <span className="sr-only">No me gusta</span>
          </Button>
          <Button
            size="icon"
            onClick={() => handleSwipe("right")}
            className="h-20 w-20 rounded-full bg-gradient-to-br from-secondary to-primary text-black hover:scale-110 transition-transform shadow-2xl shadow-primary/40"
          >
            <Heart className="h-8 w-8 fill-current" />
            <span className="sr-only">Me gusta</span>
          </Button>
        </div>
      )}

      <MatchModal
        open={showMatch}
        onOpenChange={setShowMatch}
        matchedUserId={matchedUser?.id}
        matchedUserName={matchedUser?.name}
      />
      </div>
    </div>
  )
}
