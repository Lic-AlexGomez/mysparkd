"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { extractApiRows } from "@/lib/extract-api-rows"
import { chatService } from "@/lib/services/chat"
import { groupService } from "@/lib/services/group"
import { eventService } from "@/lib/services/event"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { Chat, EventGroupJoinRequest } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageCircle, EyeOff, Trash2, MoreVertical, Eye, Users, CalendarDays, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react"
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

type UnifiedItem = {
  id: string
  type: 'direct' | 'general' | 'group' | 'meetup' | 'date'
  label: string
  name: string
  avatarUrl?: string | null
  lastMessage?: string | null
  lastMessageAt?: string | null
  unread?: number
  href: string
  isOnline?: boolean
}

const TYPE_LABEL_ES: Record<UnifiedItem['type'], string> = {
  direct: 'Directo', general: 'General', group: 'Grupo', meetup: 'MeetUp', date: 'Date',
}
const TYPE_LABEL_EN: Record<UnifiedItem['type'], string> = {
  direct: 'Direct', general: 'General', group: 'Group', meetup: 'MeetUp', date: 'Date',
}
const TYPE_COLOR: Record<UnifiedItem['type'], string> = {
  direct: 'bg-primary/15 text-primary',
  general: 'bg-muted text-muted-foreground',
  group: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  meetup: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  date: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

export default function ChatListPage() {
  const { te, t } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const [mainTab, setMainTab] = useState<'chats' | 'groups'>('chats')
  const [chats, setChats] = useState<Chat[]>([])
  const [hiddenChats, setHiddenChats] = useState<Chat[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const fetchChatsRef = useRef<() => void>(() => {})
  const [chatListTab, setChatListTab] = useState<"all" | "direct" | "general">("all")
  const [allGroups, setAllGroups] = useState<Array<{ id: string; name: string; coverPhotoUrl?: string }>>([])
  const [eventGroups, setEventGroups] = useState<Array<{ eventId: string; eventTitle: string; lastMessageContent?: string | null; lastMessageAt?: string | null }>>([])
  const [outgoingRequests, setOutgoingRequests] = useState<EventGroupJoinRequest[]>([])
  const [isSubmittingNow, setIsSubmittingNow] = useState<string | null>(null)

  const directChats = useMemo(
    () => chats.filter((c) => c.chatCategory === "DIRECT"),
    [chats]
  )
  const generalChats = useMemo(
    () => chats.filter((c) => c.chatCategory !== "DIRECT"),
    [chats]
  )
  const listedChats = chatListTab === "direct" ? directChats : chatListTab === "general" ? generalChats : []
  const unreadDirect = useMemo(
    () => directChats.reduce((s, c) => s + (c.unread || 0), 0),
    [directChats]
  )
  const unreadGeneral = useMemo(
    () => generalChats.reduce((s, c) => s + (c.unread || 0), 0),
    [generalChats]
  )

  const unifiedItems = useMemo((): UnifiedItem[] => {
    const items: UnifiedItem[] = []
    for (const c of chats) {
      const type: UnifiedItem['type'] = c.linkedFastDateId
        ? 'date'
        : c.linkedEventId
        ? 'meetup'
        : c.linkedGroupId
        ? 'group'
        : c.chatCategory === 'DIRECT'
        ? 'direct'
        : 'general'
      items.push({
        id: c.chatId,
        type,
        label: TYPE_LABEL_ES[type],
        name: c.otherUsername,
        avatarUrl: c.otherUserPhoto,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unread: c.unread,
        href: c.linkedEventId ? `/events/${c.linkedEventId}` : c.linkedGroupId ? `/groups/${c.linkedGroupId}` : `/chat/${c.chatId}`,
        isOnline: onlineUsers.has(c.otherUserId),
      })
    }
    for (const g of allGroups) {
      if (items.some((i) => i.href === `/groups/${g.id}`)) continue
      items.push({
        id: `group-${g.id}`,
        type: 'group',
        label: TYPE_LABEL_ES.group,
        name: g.name,
        avatarUrl: g.coverPhotoUrl,
        lastMessage: null,
        lastMessageAt: null,
        href: `/groups/${g.id}`,
      })
    }
    for (const eg of eventGroups) {
      if (items.some((i) => i.href === `/events/${eg.eventId}`)) continue
      items.push({
        id: `event-${eg.eventId}`,
        type: 'meetup',
        label: TYPE_LABEL_ES.meetup,
        name: eg.eventTitle,
        avatarUrl: null,
        lastMessage: eg.lastMessageContent,
        lastMessageAt: eg.lastMessageAt,
        href: `/events/${eg.eventId}`,
      })
    }
    return items.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0
      if (!a.lastMessageAt) return 1
      if (!b.lastMessageAt) return -1
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })
  }, [chats, allGroups, eventGroups, onlineUsers])

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

  useEffect(() => {
    if (!user?.userId) return
    groupService.myGroups()
      .then((rows) => setAllGroups(rows.map((g) => ({ id: g.id, name: g.name, coverPhotoUrl: g.coverPhotoUrl }))))
      .catch(() => {})
    eventService.groupJoinRequests.myEventGroups()
      .then((rows) => setEventGroups(Array.isArray(rows) ? rows : []))
      .catch(() => {})
    eventService.groupJoinRequests.myOutgoing()
      .then((rows) => setOutgoingRequests(Array.isArray(rows) ? rows : []))
      .catch(() => {})
  }, [user?.userId])

  const handleSubmitNow = async (requestId: string) => {
    setIsSubmittingNow(requestId)
    try {
      await eventService.groupJoinRequests.submitNow(requestId)
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast.success(te("Solicitud enviada al organizador con los que aceptaron.", "Request sent to organizer with those who accepted."))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo enviar", "Could not send"))
    } finally {
      setIsSubmittingNow(null)
    }
  }

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
              {te("Mensajes", "Messages")}
            </h1>
            {mainTab === 'chats' && hiddenChats.length > 0 && (
              <button
                onClick={() => setShowHidden(!showHidden)}
                className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <EyeOff className="h-3.5 w-3.5" />
                {hiddenChats.length} {te(hiddenChats.length > 1 ? 'ocultos' : 'oculto', 'hidden')}
              </button>
            )}
            {/* Selector principal */}
            <div className="flex gap-1 mt-3 p-1 bg-muted rounded-xl w-fit">
              <button
                onClick={() => setMainTab('chats')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  mainTab === 'chats' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageCircle className="h-4 w-4" />{te("Chats", "Chats")}
              </button>
              <button
                onClick={() => setMainTab('groups')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
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
                  onClick={() => setChatListTab("all")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                    chatListTab === "all"
                      ? "bg-card text-foreground shadow-sm ring-1 ring-primary/25"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {te("Todo", "All")}
                </button>
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

        {/* ── ALL TAB ── */}
        {mainTab === 'chats' && chatListTab === 'all' && (
          <div className="p-4 space-y-3">
            {/* Solicitudes grupales salientes (invitador esperando respuestas) */}
            {outgoingRequests.length > 0 && (
              <div className="mb-2 space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {te("Invitaciones enviadas en espera", "Sent group invitations — awaiting responses")}
                </p>
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="rounded-2xl border border-primary/25 bg-primary/6 px-4 py-3">
                    <p className="text-sm font-medium">
                      {te(`Solicitud para "${req.eventTitle}"`, `Request for "${req.eventTitle}"`)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {req.members.filter((m) => m.userId !== user?.userId?.toString()).map((m) => (
                        <span key={m.userId} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {m.status === 'ACCEPTED' && <CheckCircle2 className="size-3 text-emerald-500" />}
                          {m.status === 'PENDING' && <Clock className="size-3 text-amber-500" />}
                          {m.status === 'DECLINED' && <XCircle className="size-3 text-destructive" />}
                          @{m.username}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => router.push(`/events/${req.eventId}`)}
                        className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        {te("Ver evento", "View event")}
                      </button>
                      <button
                        onClick={() => handleSubmitNow(req.id)}
                        disabled={isSubmittingNow === req.id || !req.members.some((m) => m.status === 'ACCEPTED' && m.userId !== user?.userId?.toString())}
                        className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40 transition-colors"
                      >
                        {isSubmittingNow === req.id
                          ? <Loader2 className="size-3 animate-spin" />
                          : te("Enviar con los que aceptaron", "Send with those who accepted")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lista unificada */}
            {unifiedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground/40" />
                <p className="text-base font-semibold text-muted-foreground">{te("No hay conversaciones aún", "No conversations yet")}</p>
              </div>
            ) : (
              unifiedItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-card to-muted/20 rounded-2xl border border-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
                >
                  <div className="relative shrink-0">
                    <div className="h-14 w-14 rounded-full border-2 border-primary/30 ring-4 ring-primary/10 group-hover:scale-110 transition-transform overflow-hidden bg-muted flex items-center justify-center">
                      {item.avatarUrl
                        ? <img src={item.avatarUrl} alt={item.name} className="h-full w-full object-cover" />
                        : item.type === 'meetup'
                        ? <CalendarDays className="size-6 text-emerald-500" />
                        : item.type === 'group'
                        ? <Users className="size-6 text-violet-500" />
                        : <MessageCircle className="size-6 text-primary" />}
                    </div>
                    {item.isOnline !== undefined && (
                      <span className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${item.isOnline ? 'bg-green-500' : 'bg-muted-foreground/50'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLOR[item.type]}`}>
                        {item.label}
                      </span>
                      {item.lastMessageAt && (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.lastMessageAt), { addSuffix: true, locale: es })}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-foreground truncate">{item.name}</p>
                    <p className={`text-sm truncate ${item.unread && item.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {item.lastMessage || te("Sin mensajes aún", "No messages yet")}
                    </p>
                  </div>
                  {item.unread && item.unread > 0 ? (
                    <span className="shrink-0 flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-black text-xs font-bold">
                      {item.unread > 99 ? '99+' : item.unread}
                    </span>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        )}

        {/* Grupos */}
        {mainTab === 'groups' && <GroupsPage />}

        {/* Chats */}
        {mainTab === 'chats' && chatListTab !== 'all' && (<>

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

