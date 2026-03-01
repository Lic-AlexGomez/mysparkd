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
      const feedData = await api.get<any[]>("/api/posts/feed")
      const myProfile = await api.get<any>("/api/profile/me")
      const myUserId = myProfile.userId
      
      console.log('Feed data:', feedData)
      console.log('My userId:', myUserId)
      
      const uniqueUsers = new Map<string, UserProfile>()
      feedData.forEach(post => {
        if (post.userId && post.username && post.userId !== myUserId && !uniqueUsers.has(post.userId)) {
          uniqueUsers.set(post.userId, {
            userId: post.userId,
            username: post.username,
            nombres: post.username,
            apellidos: '',
            sex: 'MALE',
            telefono: '',
            bio: post.body?.substring(0, 100) || 'Sin descripción',
            photos: post.file ? [{ url: post.file, position: 0, primary: true }] : [],
            interests: [],
            reputation: post.reputation || 75
          })
        }
      })
      
      const profiles = Array.from(uniqueUsers.values())
      console.log('Profiles discovered:', profiles.length)
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
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-6">
      <h1 className="mb-6 text-lg font-bold text-foreground">Descubrir</h1>

      {/* Card stack */}
      <div className="relative h-[60vh] w-full max-h-[500px]">
        {noMoreProfiles ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card">
            <Zap className="h-16 w-16 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">
              No hay mas perfiles
            </p>
            <p className="text-sm text-muted-foreground text-center px-8">
              Vuelve mas tarde para ver nuevas personas
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
              />
            )}
            {currentProfile && (
              <SwipeCard
                key={currentProfile.userId}
                user={currentProfile}
                onSwipe={handleSwipe}
                isTop={true}
              />
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Action buttons */}
      {!noMoreProfiles && (
        <div className="mt-6 flex items-center gap-6">
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleSwipe("left")}
            className="h-16 w-16 rounded-full border-2 border-destructive/30 bg-card text-destructive hover:bg-destructive/10 hover:border-destructive"
          >
            <X className="h-7 w-7" />
            <span className="sr-only">No me gusta</span>
          </Button>
          <Button
            size="icon"
            onClick={() => handleSwipe("right")}
            className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-lg hover:opacity-90"
          >
            <Heart className="h-7 w-7" />
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
  )
}
