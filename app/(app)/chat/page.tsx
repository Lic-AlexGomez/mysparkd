"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { chatService } from "@/lib/services/chat"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { Chat } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function ChatListPage() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const fetchChatsRef = useRef<() => void>(() => {})

  const fetchChats = useCallback(async () => {
    try {
      const data = await chatService.getMyChats()

      const chatsWithPhotos = await Promise.all(
        data.map(async (chat) => {
          try {
            const profile = await api.get<any>(`/api/profile/${chat.otherUserId}`)
            return {
              ...chat,
              otherUserPhoto: profile.profilePictureUrl || profile.photos?.[0]?.url || profile.photoUrl
            }
          } catch {
            return chat
          }
        })
      )

      const sorted = chatsWithPhotos.sort((a, b) => {
        if (!a.lastMessageAt) return 1
        if (!b.lastMessageAt) return -1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      })

      setChats(sorted)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Mantener ref actualizada para usarla dentro del callback del WS
  useEffect(() => {
    fetchChatsRef.current = fetchChats
  }, [fetchChats])

  // Refrescar lista cuando llega un mensaje nuevo en cualquier chat
  const wsCallbacksRef = useRef({
    onChatUpdated: (_chatId: string) => {
      fetchChatsRef.current()
    },
    onPresence: (event: any) => {
      const userId = event.userId?.toString ? event.userId.toString() : String(event.userId)
      setOnlineUsers(prev => {
        const next = new Set(prev)
        if (event.status === 'ONLINE') next.add(userId)
        else next.delete(userId)
        return next
      })
    },
  })

  useWebSocket(user?.userId, wsCallbacksRef.current)

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
    <div className="flex justify-center bg-gradient-to-b from-background to-muted/20">
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
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-primary/30 ring-4 ring-primary/10 group-hover:scale-110 transition-transform relative z-10">
                    <AvatarImage src={chat.otherUserPhoto} alt={chat.otherUsername} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                      {chat.otherUsername?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute pb-1 bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background z-20 ${onlineUsers.has(chat.otherUserId) ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        window.location.href = `/profile/${chat.otherUserId}`
                      }}
                      className="font-bold cursor-pointer hover:text-primary hover:underline text-foreground"
                    >
                      {chat.otherUsername}
                    </span>
                    <div className="flex items-center gap-2">
                      {chat.lastMessageAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.lastMessageAt + 'Z'), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      )}
                      {!!chat.unread && chat.unread > 0 && (
                        <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-black text-xs font-bold">
                          {chat.unread > 99 ? '99+' : chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm truncate ${
                    chat.unread && chat.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
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
