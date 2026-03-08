"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { matchService } from "@/lib/services/match"
import { useAuth } from "@/lib/auth-context"
import type { Match, Chat } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Loader2,
  Heart,
  MessageCircle,
  MoreVertical,
  UserX,
  Ban,
  Sparkles,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function MatchesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMatches = useCallback(async () => {
    try {
      const data = await api.get<Match[]>("/api/matches/my/matches")
      console.log('Matches data:', data)
      
      // Obtener fotos de cada match
      const matchesWithPhotos = await Promise.all(
        data.map(async (match) => {
          try {
            const profile = await api.get<any>(`/api/profile/${match.userId}`)
            return {
              ...match,
              photoUrl: profile.photos?.[0]?.url || profile.photoUrl,
              bio: profile.bio,
              edad: profile.edad,
              apellidos: profile.apellidos
            }
          } catch {
            return match
          }
        })
      )
      
      setMatches(matchesWithPhotos)
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMatches([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const handleChat = async (userId: string) => {
    try {
      const chat = await api.post<Chat>(`/api/chat/open/${userId}`)
      router.push(`/chat/${chat.chatId}`)
    } catch {
      toast.error("Error al abrir chat")
    }
  }

  const handleUnmatch = async (userId: string) => {
    try {
      await api.post(`/api/matches/${userId}/unmatch`)
      toast.success("Match eliminado")
      fetchMatches()
    } catch {
      toast.error("Error al eliminar match")
    }
  }

  const handleBlock = async (userId: string) => {
    try {
      await api.post(`/api/matches/${userId}/block`)
      toast.success("Usuario bloqueado")
      fetchMatches()
    } catch {
      toast.error("Error al bloquear")
    }
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Matches</h1>
            <p className="text-sm text-muted-foreground mt-1">{matches.length} {matches.length === 1 ? 'match' : 'matches'}</p>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-secondary/30 rounded-full" />
              <Heart className="h-20 w-20 text-secondary relative" />
            </div>
            <p className="text-xl font-semibold">No tienes matches aún</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              ¡Sigue deslizando para encontrar a alguien especial!
            </p>
            <Button
              onClick={() => router.push("/swipes")}
              className="mt-4 bg-gradient-to-r from-primary to-secondary text-black font-semibold px-6 py-6 rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              Ir a Swipes
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {matches.map((match) => (
              <div
                key={match.matchId}
                className="relative overflow-hidden rounded-3xl border border-primary/10 hover:border-secondary/30 hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-300 group bg-gradient-to-br from-card to-muted/20"
              >
                {/* Background gradient */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-secondary/5 to-transparent rounded-full blur-3xl" />
                
                <div className="relative p-5">
                  {/* Header con foto y nombre */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <Avatar
                        className="h-20 w-20 cursor-pointer border-4 border-secondary/30 ring-4 ring-secondary/10 group-hover:scale-110 transition-transform"
                        onClick={() => router.push(`/profile/${match.userId}`)}
                      >
                        {match.photoUrl ? (
                          <AvatarImage src={match.photoUrl} alt={match.nombre} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-secondary/20 to-secondary/10 text-secondary font-bold text-xl">
                          {match.nombre?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {match.compatibilityScore && match.compatibilityScore > 70 && (
                        <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg">
                          <Sparkles className="h-4 w-4 text-black" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-xl text-foreground truncate">
                          {match.nombre}{match.apellidos ? ` ${match.apellidos}` : ''}
                        </h3>
                        {match.edad && (
                          <span className="text-lg text-muted-foreground">{match.edad}</span>
                        )}
                      </div>
                      
                      {match.compatibilityScore && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                              style={{ width: `${match.compatibilityScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-primary">{match.compatibilityScore}%</span>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Heart className="h-3 w-3 text-secondary fill-secondary" />
                        Match{" "}
                        {formatDistanceToNow(new Date(match.matchedAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-muted-foreground hover:bg-muted/50 rounded-xl"
                        >
                          <MoreVertical className="h-5 w-5" />
                          <span className="sr-only">Opciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem
                          onClick={() => handleUnmatch(match.userId)}
                          className="cursor-pointer"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Eliminar match
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleBlock(match.userId)}
                          className="text-destructive cursor-pointer"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Bloquear
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Bio */}
                  {match.bio && (
                    <p className="text-sm text-foreground/80 mb-3 line-clamp-2">
                      {match.bio}
                    </p>
                  )}

                  {/* Intereses */}
                  {match.interests && match.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {match.interests.map((interest, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-primary/10 text-primary border-0 text-xs px-2 py-1"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Último mensaje */}
                  {match.lastMessage && (
                    <div className="bg-muted/30 rounded-xl p-3 mb-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        {match.lastMessageAt && formatDistanceToNow(new Date(match.lastMessageAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                      <p className="text-sm text-foreground line-clamp-1">{match.lastMessage}</p>
                    </div>
                  )}

                  {/* Botón de chat */}
                  <Button
                    onClick={() => handleChat(match.userId)}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary text-black font-semibold hover:scale-105 transition-transform shadow-lg"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {match.lastMessage ? 'Continuar conversación' : 'Enviar mensaje'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
