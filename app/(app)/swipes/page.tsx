"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { compatibilityService } from "@/lib/services/compatibility"
import { reputationService } from "@/lib/services/reputation"
import { matchService } from "@/lib/services/match"
import type { UserProfile, SwipeResponse } from "@/lib/types"
import { SwipeCard } from "@/components/swipes/swipe-card"
import { MatchModal } from "@/components/swipes/match-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Heart, Loader2, Zap, Eye } from "lucide-react"
import { AnimatePresence } from "framer-motion"

export default function SwipesPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedUser, setMatchedUser] = useState<{ id: string; name: string } | null>(null)

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await api.get<any>("/api/discover?page=0&size=20")
      const discoverProfiles = response.content || []
      
      const profiles = discoverProfiles.map((item: any) => ({
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
    } catch (error) {
      console.error('Error fetching profiles:', error)
      setProfiles([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const handleSwipe = async (direction: "left" | "right") => {
    const currentProfile = profiles[currentIndex]
    if (!currentProfile) return

    const type = direction === "right" ? "LIKE" : "DISLIKE"

    try {
      if (type === "LIKE") {
        const result = matchService.like('current-user-id', currentProfile.userId)
        
        if (result.matched) {
          const { createNotification } = await import('@/lib/utils/notifications')
          await createNotification(currentProfile.userId, 'match', '¡Tienes un nuevo match!', 'current-user-id')
          setMatchedUser({
            id: currentProfile.userId,
            name: `${currentProfile.nombres} ${currentProfile.apellidos}`,
          })
          setShowMatch(true)
        }
      }
      
      const response = await api.post<SwipeResponse>("/api/swipes/perform/swipe", {
        targetUserId: currentProfile.userId,
        type,
      })

      if (response.matched) {
        setMatchedUser({
          id: currentProfile.userId,
          name: `${currentProfile.nombres} ${currentProfile.apellidos}`,
        })
        setShowMatch(true)
      }
    } catch {
      // silent
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
      {!noMoreProfiles && (
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
