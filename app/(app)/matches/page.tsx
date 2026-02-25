"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { Match, Chat } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMatches = useCallback(async () => {
    try {
      const data = await api.get<Match[]>("/api/matches/my/matches")
      setMatches(data)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-16 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-bold text-foreground">Matches</h1>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Heart className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No tienes matches aun</p>
          <p className="text-sm text-muted-foreground">
            Sigue deslizando para encontrar a alguien!
          </p>
          <Button
            onClick={() => router.push("/swipes")}
            className="mt-2 bg-primary text-primary-foreground"
          >
            Ir a Swipes
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {matches.map((match) => (
            <div
              key={match.matchId}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <Avatar
                className="h-14 w-14 cursor-pointer border-2 border-primary/30"
                onClick={() => router.push(`/profile/${match.userId}`)}
              >
                <AvatarFallback className="bg-primary/20 text-primary">
                  {match.nombre?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {match.nombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  Match{" "}
                  {formatDistanceToNow(new Date(match.matchedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleChat(match.userId)}
                  className="text-primary hover:bg-primary/10"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="sr-only">Chat</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Opciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-card border-border"
                  >
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
