"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { chatService } from "@/lib/services/chat"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { Chat } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageCircle, EyeOff, Trash2, MoreVertical, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

export default function ChatListPage() {
  const { te, t } = useI18n()
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [hiddenChats, setHiddenChats] = useState<Chat[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const fetchChatsRef = useRef<() => void>(() => {})
  const [swipedChatId, setSwipedChatId] = useState<string | null>(null)

  const refreshPresence = useCallback(async (chatList: Chat[]) => {
    if (chatList.length === 0) return
    const results = await Promise.allSettled(
      chatList.map(chat => api.get<any>(`/api/presence/${chat.otherUserId}`))
    )
    const onlineSet = new Set<string>()
    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.status === 'ONLINE') {
        onlineSet.add(chatList[i].otherUserId)
      }
    })
    setOnlineUsers(onlineSet)
  }, [])

  const handleHideChat = async (chatId: string) => {
    try {
      await api.post(`/api/chat/chats/${chatId}/hide`)
      setChats(prev => prev.filter(c => c.chatId !== chatId))
      toast.success(te('Chat ocultado', 'Chat hidden'))
    } catch {
      toast.error(te('Error al ocultar chat', 'Error hiding chat'))
    }
  }

  const handleUnhideChat = async (chatId: string) => {
    try {
      await api.post(`/api/chat/chats/${chatId}/unhide`)
      setHiddenChats(prev => prev.filter(c => c.chatId !== chatId))
      fetchChats()
      toast.success(te('Chat restaurado', 'Chat restored'))
    } catch {
      toast.error(te('Error al restaurar chat', 'Error restoring chat'))
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      await api.delete(`/api/chat/chats/${chatId}`)
      setChats(prev => prev.filter(c => c.chatId !== chatId))
      toast.success(te('Chat eliminado', 'Chat deleted'))
    } catch {
      toast.error(te('Error al eliminar chat', 'Error deleting chat'))
    }
  }

  const fetchChats = useCallback(async () => {
    try {
      const raw = await chatService.getMyChats()
      if (raw.length > 0) console.log('[chat] campos del backend:', Object.keys(raw[0]), raw[0])
      const data = raw.map((c: any) => ({
        ...c,
        otherUserPhoto: c.otherUserPhoto || c.senderProfilePicture || c.otherUserProfilePicture || c.profilePicture || c.photo || c.avatar || undefined,
      }))

      const sorted = data.sort((a, b) => {
        if (!a.lastMessageAt) return 1
        if (!b.lastMessageAt) return -1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      })

      setChats(sorted)

      // Presencia en paralelo, sin bloquear el render
      refreshPresence(sorted)

      // Chats ocultos en paralelo
      api.get<any[]>('/api/chat/chats/hidden')
        .then(hidden => {
          setHiddenChats(hidden.map(c => ({
            ...c,
            otherUserPhoto: c.otherUserPhoto || c.senderProfilePicture || c.otherUserProfilePicture || c.profilePicture || c.photo || c.avatar || undefined,
          })))
        })
        .catch(() => {})
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [refreshPresence])

  // Mantener ref actualizada para usarla dentro del callback del WS
  useEffect(() => {
    fetchChatsRef.current = fetchChats
  }, [fetchChats])

  const wsCallbacks = {
    onChatUpdated: (_chatId: string) => {
      fetchChatsRef.current()
    },
    onPresence: (event: any) => {
      const userId = event.userId?.toString ? event.userId.toString() : String(event.userId)
      setOnlineUsers(prev => {
        const next = new Set(prev)
        if (event.status?.toUpperCase() === 'ONLINE') next.add(userId)
        else next.delete(userId)
        return next
      })
    },
    onPresenceSnapshot: (events: any[]) => {
      setOnlineUsers(new Set(
        events
          .filter(e => e.status?.toUpperCase() === 'ONLINE')
          .map(e => e.userId?.toString ? e.userId.toString() : String(e.userId))
      ))
    },
  }

  useWebSocket(user?.userId, wsCallbacks)

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // Refrescar presencia cada 30s para detectar desconexiones
  useEffect(() => {
    const interval = setInterval(() => {
      setChats(prev => { refreshPresence(prev); return prev })
    }, 30_000)
    return () => clearInterval(interval)
  }, [refreshPresence])

  if (isLoading) {
    return (
      <div className="flex justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="w-full max-w-[680px]">
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5">
            <div className="px-6 py-4">
              <div className="h-8 w-32 bg-muted rounded-lg animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded mt-2 animate-pulse" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-primary/10">
                <div className="h-14 w-14 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-3 w-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-[680px]">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">{te("Mensajes", "Messages")}</h1>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-muted-foreground">{chats.length} {chats.length === 1 ? te('conversación', 'conversation') : te('conversaciones', 'conversations')}</p>
              {hiddenChats.length > 0 && (
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  {hiddenChats.length} {te(hiddenChats.length > 1 ? 'ocultos' : 'oculto', hiddenChats.length > 1 ? 'hidden' : 'hidden')}
                </button>
              )}
            </div>
          </div>
        </div>

        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full" />
              <MessageCircle className="h-20 w-20 text-primary relative" />
            </div>
            <p className="text-xl font-semibold">{te("No tienes conversaciones", "You have no conversations")}</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {te("Haz match con alguien para empezar a chatear", "Match with someone to start chatting")}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {chats.map((chat) => (
              <div key={chat.chatId} className="relative flex items-center gap-4 p-4 bg-gradient-to-br from-card to-muted/20 rounded-2xl border border-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl pointer-events-none" />
                <Link href={`/chat/${chat.chatId}`} className="flex items-center gap-4 flex-1 min-w-0">
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
                    <span className="font-bold text-foreground truncate">{chat.otherUsername}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {chat.lastMessageAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true, locale: es })}
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
                    {chat.lastMessage || te("Sin mensajes aún", "No messages yet")}
                  </p>
                </div>
                </Link>
                {/* Menú de acciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors z-10" onClick={e => e.preventDefault()} aria-label={te("Opciones del chat", "Chat options")}>
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem onClick={() => handleHideChat(chat.chatId)} className="cursor-pointer gap-2">
                      <EyeOff className="h-4 w-4" /> {te("Ocultar", "Hide")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteChat(chat.chatId)} className="cursor-pointer gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" /> {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        {/* Chats ocultos */}
        {showHidden && hiddenChats.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{te("Chats ocultos", "Hidden chats")}</p>
            <div className="space-y-2">
              {hiddenChats.map(chat => (
                <div key={chat.chatId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={chat.otherUserPhoto} alt={chat.otherUsername} className="object-cover" />
                    <AvatarFallback className="text-xs">{chat.otherUsername?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">{chat.otherUsername}</span>
                  <button
                    onClick={() => handleUnhideChat(chat.chatId)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" /> {te("Mostrar", "Show")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

