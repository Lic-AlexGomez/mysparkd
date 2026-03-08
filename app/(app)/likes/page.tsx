"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Heart, X, Sparkles, Eye, User } from "lucide-react"
import { toast } from "sonner"

interface LikedMeProfile {
  profile: {
    userId: string
    nombres: string
    apellidos: string
    sex: string
    dateOfBirth: string
    photos: { url: string; primary: boolean }[]
  }
  compatibilityScore: number
}

export default function LikesPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<LikedMeProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLikes = useCallback(async () => {
    try {
      const data = await api.get<LikedMeProfile[]>("/api/swipes/liked-me")
      console.log('Likes data:', data)
      setProfiles(data)
    } catch (error) {
      console.error('Error fetching likes:', error)
      setProfiles([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLikes()
  }, [fetchLikes])

  const handleSwipe = async (userId: string, type: "LIKE" | "DISLIKE") => {
    try {
      await api.post("/api/swipes/perform/swipe", {
        targetUserId: userId,
        type,
      })
      
      setProfiles(prev => prev.filter(p => p.profile.userId !== userId))
      
      if (type === "LIKE") {
        toast.success("¡Match realizado!")
      }
    } catch (error) {
      console.error('Error en swipe:', error)
      toast.error("Error al procesar")
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex justify-center min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-[680px]">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Les gustas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {profiles.length} {profiles.length === 1 ? 'persona' : 'personas'} te dieron like
            </p>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full" />
              <Heart className="h-20 w-20 text-primary relative" />
            </div>
            <p className="text-xl font-semibold">Nadie te ha dado like aún</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              ¡Sigue activo en la app para recibir más likes!
            </p>
            <Button
              onClick={() => router.push("/swipes")}
              className="mt-4 bg-gradient-to-r from-primary to-secondary text-black font-semibold px-6 py-6 rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              Ir a Swipes
            </Button>
          </div>
        ) : (
          <div className="p-4 grid md:grid-cols-2 gap-4">
            {profiles.map((item) => {
              const profile = item.profile
              const age = calculateAge(profile.dateOfBirth)
              const mainPhoto = profile.photos?.[0]?.url
              
              console.log('Profile:', profile.userId)
              console.log('Photos array:', profile.photos)
              console.log('Main photo:', mainPhoto)

              return (
                <div
                  key={profile.userId}
                  className="relative overflow-hidden rounded-3xl border-2 border-primary/20 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 group bg-gradient-to-br from-card to-muted/20"
                >
                  {/* Background image */}
                  <div className="relative h-80 overflow-hidden">
                    {mainPhoto ? (
                      <img
                        src={mainPhoto}
                        alt={profile.nombres}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <User className="h-32 w-32 text-primary/40" />
                      </div>
                    )}
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Compatibility badge */}
                    {item.compatibilityScore > 70 && (
                      <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg animate-pulse">
                        <Sparkles className="h-6 w-6 text-black" />
                      </div>
                    )}
                    
                    {/* Info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-2xl text-white drop-shadow-lg">
                            {profile.nombres}
                          </h3>
                          <p className="text-white/90 text-lg">{age} años</p>
                        </div>
                        <Badge className="bg-primary/90 text-white border-0 backdrop-blur-sm">
                          <Heart className="h-3 w-3 mr-1 fill-white" />
                          {item.compatibilityScore}%
                        </Badge>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSwipe(profile.userId, "DISLIKE")}
                          size="icon"
                          className="h-14 w-14 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white border-2 border-white/20 hover:scale-110 transition-transform"
                        >
                          <X className="h-6 w-6" />
                        </Button>
                        <Button
                          onClick={() => router.push(`/profile/${profile.userId}`)}
                          size="icon"
                          className="h-14 w-14 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white border-2 border-white/20 hover:scale-110 transition-transform"
                        >
                          <Eye className="h-6 w-6" />
                        </Button>
                        <Button
                          onClick={() => handleSwipe(profile.userId, "LIKE")}
                          className="flex-1 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-black font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/50"
                        >
                          <Heart className="h-5 w-5 mr-2 fill-current" />
                          Me gusta
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
