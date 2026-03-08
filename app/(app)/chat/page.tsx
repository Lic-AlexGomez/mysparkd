"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import type { Chat } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function ChatListPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchChats = useCallback(async () => {
    try {
      const data = await api.get<Chat[]>("/api/chat/chats")
      
      const chatsWithPhotos = await Promise.all(
        data.map(async (chat) => {
          try {
            const profile = await api.get<any>(`/api/profile/${chat.otherUserId}`)
            return {
              ...chat,
              otherUserPhoto: profile.photos?.[0]?.url || profile.photoUrl
            }
          } catch {
            return chat
          }
        })
      )
      
      setChats(chatsWithPhotos)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Mensajes</h1>
            <p className="text-sm text-muted-foreground mt-1">{chats.length} {chats.length === 1 ? 'conversación' : 'conversaciones'}</p>
          </div>
        </div>

        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full" />
              <MessageCircle className="h-20 w-20 text-primary relative" />
            </div>
            <p className="text-xl font-semibold">No tienes conversaciones</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Haz match con alguien para empezar a chatear
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {chats.map((chat) => (
              <Link
                key={chat.chatId}
                href={`/chat/${chat.chatId}`}
                className="relative overflow-hidden flex items-center gap-4 p-4 bg-gradient-to-br from-card to-muted/20 rounded-2xl border border-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl" />
                <Avatar className="h-14 w-14 border-2 border-primary/30 ring-4 ring-primary/10 group-hover:scale-110 transition-transform relative z-10">
                  <AvatarImage src={chat.otherUserPhoto} alt={chat.otherUsername} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                    {chat.otherUsername?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={`/profile/${chat.otherUserId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-foreground hover:text-primary hover:underline"
                    >
                      {chat.otherUsername}
                    </Link>
                    {chat.lastMessageAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(chat.lastMessageAt + 'Z'), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage || "Sin mensajes aún"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
