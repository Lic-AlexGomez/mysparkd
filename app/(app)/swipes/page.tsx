"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import type { UserProfile, SwipeResponse } from "@/lib/types"
import { SwipeCard } from "@/components/swipes/swipe-card"
import { MatchModal } from "@/components/swipes/match-modal"
import { Button } from "@/components/ui/button"
import { X, Heart, Loader2, Flame } from "lucide-react"
import { AnimatePresence } from "framer-motion"

export default function SwipesPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedUser, setMatchedUser] = useState<{ id: string; name: string } | null>(null)

  const fetchProfiles = useCallback(async () => {
    try {
      // Use the feed to discover users, or a discovery endpoint if available
      const data = await api.get<UserProfile[]>("/api/profile/me")
      // For now, we'll set profiles from what's available
      // The backend may need a /discover or similar endpoint
      setProfiles([])
    } catch {
      // silent
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
            <Flame className="h-16 w-16 text-muted-foreground" />
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
