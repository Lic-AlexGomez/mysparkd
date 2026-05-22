"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { extractApiRows } from "@/lib/extract-api-rows"
import { chatService } from "@/lib/services/chat"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { Chat } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageCircle, EyeOff, Trash2, MoreVertical, Eye, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { useI18n } from "@/lib/i18n"

const GroupsPage = dynamic(
  async () => {
    const mod = await import("@/components/chat/groups-section-content")
    return { default: mod.GroupsSection }
  },
  { ssr: false }
)

export default function ChatListPage() {
  const { te, t } = useI18n()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [mainTab, setMainTab] = useState<'chats' | 'groups'>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'groups' ? 'groups' : 'chats'
  )
  const [chats, setChats] = useState<Chat[]>([])
  const [hiddenChats, setHiddenChats] = useState<Chat[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const fetchChatsRef = useRef<() => void>(() => {})
  const [swipedChatId, setSwipedChatId] = useState<string | null>(null)
  const [chatListTab, setChatListTab] = useState<"direct" | "general">("direct")

  const directChats = useMemo(
    () => chats.filter((c) => c.chatCategory === "DIRECT"),
    [chats]
  )
  const generalChats = useMemo(
    () => chats.filter((c) => c.chatCategory !== "DIRECT"),
    [chats]
  )
  const listedChats = chatListTab === "direct" ? directChats : generalChats
  const unreadDirect = useMemo(
    () => directChats.reduce((s, c) => s + (c.unread || 0), 0),
    [directChats]
  )
  const unreadGeneral = useMemo(
    () => generalChats.reduce((s, c) => s + (c.unread || 0), 0),
    [generalChats]
  )

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

  const handleSetChatCategory = async (chatId: string, category: "DIRECT" | "GENERAL") => {
    try {
      await chatService.setChatCategory(chatId, category)
      setChats((prev) =>
        prev.map((c) => (c.chatId === chatId ? { ...c, chatCategory: category } : c))
      )
      toast.success(
        category === "DIRECT"
          ? te("Chat movido a Directos", "Chat moved to Direct")
          : te("Chat movido a General", "Chat moved to General")
      )
    } catch {
      toast.error(te("No se pudo mover el chat", "Could not move chat"))
    }
  }

  const fetchChats = useCallback(async () => {
    try {
      const raw = await chatService.getMyChats()
      const data = raw.map((c) => ({
        ...c,
        chatId: String(c.chatId),
        otherUserPhoto:
          c.otherUserPhoto ||
          c.senderProfilePicture ||
          undefined,
      }))

      const withCategory: Chat[] = data.map((c: Chat & { chatCategory?: string }) => ({
        ...c,
        chatCategory:
          c.chatCategory === "DIRECT" || c.chatCategory === "GENERAL"
            ? c.chatCategory
            : "GENERAL",
      }))

      const sorted = withCategory.sort((a, b) => {
        if (!a.lastMessageAt) return 1
        if (!b.lastMessageAt) return -1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      })

      setChats(sorted)

      // Presencia en paralelo, sin bloquear el render
      refreshPresence(sorted)

      // Chats ocultos en paralelo
      api.get<unknown>('/api/chat/chats/hidden')
        .then((hidden) => {
          const rows = extractApiRows<Chat & { id?: string }>(hidden)
          setHiddenChats(
            rows.map((c) => ({
              ...c,
              chatId: String(c.chatId ?? c.id ?? ""),
              otherUserPhoto:
                c.otherUserPhoto ||
                c.senderProfilePicture ||
                undefined,
            }))
          )
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              {mainTab === 'chats' ? te("Mensajes", "Messages") : te("Grupos", "Groups")}
            </h1>
            <div className="flex items-center justify-between mt-1">
              {mainTab === 'chats' && (
                <p className="text-sm text-muted-foreground">
                  {listedChats.length}{" "}
                  {listedChats.length === 1 ? te("conversación", "conversation") : te("conversaciones", "conversations")}
                </p>
              )}
              {mainTab === 'chats' && hiddenChats.length > 0 && (
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  {hiddenChats.length} {te(hiddenChats.length > 1 ? 'ocultos' : 'oculto', 'hidden')}
                </button>
              )}
            </div>
            {/* Selector */}
            <div className="flex gap-1 mt-3 p-1 bg-muted rounded-xl w-fit">
              <button
                onClick={() => setMainTab('chats')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  mainTab === 'chats' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageCircle className="h-4 w-4" />{te("Chats", "Chats")}
              </button>
              <button
                onClick={() => setMainTab('groups')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  mainTab === 'groups' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />{te("Grupos", "Groups")}
              </button>
            </div>
            {mainTab === "chats" && (
              <div className="flex gap-2 mt-3 w-full max-w-md">
                <button
                  type="button"
                  onClick={() => setChatListTab("direct")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                    chatListTab === "direct"
                      ? "bg-card text-foreground shadow-sm ring-1 ring-primary/25"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {te("Directos", "Direct")}
                  {unreadDirect > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-black">
                      {unreadDirect > 99 ? "99+" : unreadDirect}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setChatListTab("general")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                    chatListTab === "general"
                      ? "bg-card text-foreground shadow-sm ring-1 ring-primary/25"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {te("General", "General")}
                  {unreadGeneral > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-black">
                      {unreadGeneral > 99 ? "99+" : unreadGeneral}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grupos */}
        {mainTab === 'groups' && <GroupsPage />}

        {/* Chats */}
        {mainTab === 'chats' && (<>

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
        ) : listedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 px-6">
            <p className="text-sm font-medium text-foreground">
              {chatListTab === "direct"
                ? te("No hay chats en Directos", "No chats in Direct")
                : te("No hay chats en General", "No chats in General")}
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              {te("Usa el menú ⋮ en un chat para moverlo de pestaña.", "Use ⋮ on a chat to move it between tabs.")}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {listedChats.map((chat) => (
              <div key={chat.chatId} className="relative flex items-center gap-4 p-4 bg-gradient-to-br from-card to-muted/20 rounded-2xl border border-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl pointer-events-none" />
                <Link href={`/chat/${encodeURIComponent(String(chat.chatId))}`} className="flex items-center gap-4 flex-1 min-w-0">
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
                    {chat.chatCategory === "DIRECT" ? (
                      <DropdownMenuItem
                        onClick={() => handleSetChatCategory(chat.chatId, "GENERAL")}
                        className="cursor-pointer gap-2"
                      >
                        <Users className="h-4 w-4" /> {te("Mover a General", "Move to General")}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleSetChatCategory(chat.chatId, "DIRECT")}
                        className="cursor-pointer gap-2"
                      >
                        <MessageCircle className="h-4 w-4" /> {te("Mover a Directos", "Move to Direct")}
                      </DropdownMenuItem>
                    )}
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
        </>)}
      </div>
    </div>
  )
}

