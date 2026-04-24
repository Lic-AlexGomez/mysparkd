"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, RefreshCw, UserPlus, MessageCircle, Crown } from "lucide-react"
import { toast } from "sonner"

interface DiscoverProfile {
  profile: {
    userId: string
    nombres: string
    apellidos: string
    username?: string
    bio?: string
    profilePictureUrl?: string
    location?: string
    interests?: string[]
    premium?: boolean
    followersCount?: number
  }
  compatibilityScore: number
}

interface PageResponse {
  content: DiscoverProfile[]
  totalPages: number
  number: number
}

export default function DiscoverPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [following, setFollowing] = useState<Set<string>>(new Set())

  const fetchProfiles = useCallback(async (p = 0) => {
    setIsLoading(true)
    try {
      const data = await api.get<PageResponse>(`/api/discover?page=${p}&size=10`)
      if (p === 0) {
        setProfiles(data.content || [])
      } else {
        setProfiles(prev => [...prev, ...(data.content || [])])
      }
      setTotalPages(data.totalPages)
      setPage(data.number)
    } catch {
      toast.error("Error al cargar perfiles")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfiles(0) }, [fetchProfiles])

  const handleFollow = async (userId: string) => {
    try {
      await api.post(`/api/follow/${userId}`)
      setFollowing(prev => new Set(prev).add(userId))
      toast.success("Siguiendo")
    } catch {
      toast.error("Error al seguir")
    }
  }

  const handleMessage = async (userId: string) => {
    try {
      const chat = await api.post<{ chatId: string }>(`/api/chat/open/${userId}`)
      router.push(`/chat/${chat.chatId}`)
    } catch {
      toast.error("Error al abrir chat")
    }
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-primary"
    if (score >= 40) return "text-yellow-500"
    return "text-muted-foreground"
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Descubrir
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Perfiles compatibles contigo</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchProfiles(0)} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading && profiles.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Sparkles className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No hay perfiles disponibles</p>
          <p className="text-xs text-muted-foreground">Completa tu perfil e intereses para mejores sugerencias</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {profiles.map(({ profile, compatibilityScore }) => (
            <div key={profile.userId} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <button onClick={() => router.push(`/profile/${profile.userId}?compatibility=${compatibilityScore}`)}>
                  <Avatar className="h-16 w-16 shrink-0 border-2 border-primary/20">
                    <AvatarImage src={profile.profilePictureUrl} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {profile.nombres?.[0]}{profile.apellidos?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => router.push(`/profile/${profile.userId}?compatibility=${compatibilityScore}`)}
                      className="text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-foreground">{profile.nombres} {profile.apellidos}</p>
                        {profile.premium && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
                      </div>
                      {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                    </button>

                    {/* Compatibilidad */}
                    <div className="flex flex-col items-center shrink-0">
                      <span className={`text-xl font-black ${getCompatibilityColor(compatibilityScore)}`}>
                        {compatibilityScore}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">match</span>
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
                  )}

                  {profile.location && (
                    <p className="text-xs text-muted-foreground mt-1">📍 {profile.location}</p>
                  )}

                  {/* Barra de compatibilidad */}
                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                      style={{ width: `${compatibilityScore}%` }}
                    />
                  </div>

                  {/* Intereses */}
                  {profile.interests && profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.interests.slice(0, 4).map((interest, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                          {interest}
                        </span>
                      ))}
                      {profile.interests.length > 4 && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
                          +{profile.interests.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  size="sm"
                  onClick={() => handleFollow(profile.userId)}
                  disabled={following.has(profile.userId)}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-black font-semibold"
                >
                  {following.has(profile.userId) ? (
                    <><span className="mr-1">✓</span> Siguiendo</>
                  ) : (
                    <><UserPlus className="h-4 w-4 mr-1" /> Seguir</>
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleMessage(profile.userId)} className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-1" /> Mensaje
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/profile/${profile.userId}?compatibility=${compatibilityScore}`)}>
                  Ver perfil
                </Button>
              </div>
            </div>
          ))}

          {page < totalPages - 1 && (
            <Button variant="outline" onClick={() => fetchProfiles(page + 1)} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cargar más
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
