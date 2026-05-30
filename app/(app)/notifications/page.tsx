"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { extractApiRows } from "@/lib/extract-api-rows"
import { useAuth } from "@/lib/auth-context"
import type { Notification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  Loader2,
  Trash2,
  Check,
  UserPlus,
  X,
  Heart,
  Users,
  User,
  FileText,
  CheckCheck,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useI18n } from "@/lib/i18n"
import { getNotificationPath } from "@/lib/notification-routing"
import { profileHref } from "@/lib/profile-route"
import { eventService } from "@/lib/services/event"
import type { EventGroupJoinRequest } from "@/lib/types"
import { EventInviteRows } from "@/components/notifications/event-invite-rows"

interface FollowRequest {
  userId: string
  username: string
  nombres?: string
  apellidos?: string
  profilePictureUrl?: string
}

type NotificationTab = "all" | "requests" | "LIKE" | "FOLLOW" | "USER" | "POST"

const NOTIFICATIONS_PAGE_SIZE = 20

/** Solo solicitudes reales pendientes (API), no avisos tipo "ya puedes ver su contenido" */
function isPendingFollowSender(senderId: string | undefined, pendingUserIds: Set<string>) {
  return Boolean(senderId && pendingUserIds.has(senderId))
}

export default function NotificationsPage() {
  const { te } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([])
  const [eventInvites, setEventInvites] = useState<EventGroupJoinRequest[]>([])
  const [respondingEventId, setRespondingEventId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextPage, setNextPage] = useState(0)
  const [activeTab, setActiveTab] = useState<NotificationTab>("all")

  const pendingUserIds = useMemo(
    () => new Set(followRequests.map((r) => r.userId)),
    [followRequests]
  )

  const loadInitial = useCallback(async () => {
    if (!user?.userId) return
    setIsLoading(true)
    try {
      const [notifs, requests, events] = await Promise.all([
        api.get<unknown>(`/api/notifications/${user.userId}?page=0&size=${NOTIFICATIONS_PAGE_SIZE}`),
        api.get<FollowRequest[]>("/api/follow/requests").catch(() => []),
        eventService.groupJoinRequests.myPending().catch(() => []),
      ])
      const list = extractApiRows<Notification>(notifs)
      setNotifications(list)
      setFollowRequests(Array.isArray(requests) ? requests : [])
      setEventInvites(Array.isArray(events) ? events : [])
      setNextPage(1)
      setHasMore(list.length >= NOTIFICATIONS_PAGE_SIZE)
    } catch {
      toast.error(te("Error al cargar notificaciones", "Error loading notifications"))
    } finally {
      setIsLoading(false)
    }
  }, [user?.userId, te])

  const loadMore = useCallback(async () => {
    if (!user?.userId || !hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const notifs = await api.get<unknown>(
        `/api/notifications/${user.userId}?page=${nextPage}&size=${NOTIFICATIONS_PAGE_SIZE}`
      )
      const list = extractApiRows<Notification>(notifs)
      setNotifications((prev) => [...prev, ...list])
      setNextPage((p) => p + 1)
      setHasMore(list.length >= NOTIFICATIONS_PAGE_SIZE)
    } catch {
      toast.error(te("Error al cargar más", "Error loading more"))
    } finally {
      setLoadingMore(false)
    }
  }, [user?.userId, hasMore, loadingMore, nextPage, te])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  const pendingEventIds = useMemo(
    () => new Set(eventInvites.map((r) => r.eventId)),
    [eventInvites]
  )

  const activityNotifications = useMemo(
    () =>
      notifications.filter((n) => {
        if (pendingUserIds.has(n.senderId)) return false
        if (n.targetId && pendingEventIds.has(n.targetId)) return false
        return true
      }),
    [notifications, pendingUserIds, pendingEventIds]
  )

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return activityNotifications
    if (activeTab === "requests") return []
    return activityNotifications.filter((n) => n.targetType === activeTab)
  }, [activityNotifications, activeTab])

  const handleAcceptFollow = async (userId: string, notificationId?: string) => {
    try {
      await api.post(`/api/follow/accept/${userId}`)
      setFollowRequests((prev) => prev.filter((r) => r.userId !== userId))
      setNotifications((prev) => prev.filter((n) => n.senderId !== userId))
      toast.success(te("Solicitud aceptada", "Request accepted"))
    } catch {
      toast.error(te("Error al aceptar", "Error accepting"))
    }
  }

  const handleRespondEventInvite = async (requestId: string, accept: boolean) => {
    setRespondingEventId(requestId)
    try {
      await eventService.groupJoinRequests.respond(requestId, accept)
      setEventInvites((prev) => prev.filter((r) => r.id !== requestId))
      toast.success(
        accept
          ? te("Invitación aceptada", "Invitation accepted")
          : te("Invitación rechazada", "Invitation declined")
      )
    } catch {
      toast.error(te("Error al responder invitación", "Error responding to invitation"))
    } finally {
      setRespondingEventId(null)
    }
  }

  const handleRejectFollow = async (userId: string, notificationId?: string) => {
    try {
      await api.post(`/api/follow/reject/${userId}`)
      setFollowRequests((prev) => prev.filter((r) => r.userId !== userId))
      setNotifications((prev) => prev.filter((n) => n.senderId !== userId))
      toast.success(te("Solicitud rechazada", "Request rejected"))
    } catch {
      toast.error(te("Error al rechazar", "Error rejecting"))
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.notificationId)
    router.push(
      getNotificationPath({
        senderId: notification.senderId,
        targetId: notification.targetId,
        targetType: notification.targetType,
        viewerUserId: user?.userId,
      })
    )
  }

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`, {})
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n))
      )
    } catch {
      toast.error(te("Error al marcar como leída", "Error marking as read"))
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read)
    if (!unread.length) return
    try {
      await Promise.all(unread.map((n) => api.put(`/api/notifications/${n.notificationId}/read`, {})))
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success(te("Todo marcado como leído", "All marked as read"))
    } catch {
      toast.error(te("Error al marcar como leídas", "Error marking as read"))
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`)
      setNotifications((prev) => prev.filter((n) => n.notificationId !== id))
      toast.success(te("Notificación eliminada", "Notification deleted"))
    } catch {
      toast.error(te("Error al eliminar", "Error deleting"))
    }
  }

  const renderFollowRequestRow = (req: FollowRequest, notificationId?: string) => (
    <div key={req.userId} className="flex items-center gap-3 px-4 py-3">
      <button type="button" onClick={() => router.push(profileHref(req.userId, user?.userId))} className="shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={req.profilePictureUrl} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {(req.username || req.nombres || "?")[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => router.push(profileHref(req.userId, user?.userId))}
          className="text-sm font-semibold text-foreground truncate hover:underline text-left block w-full"
        >
          {req.username || [req.nombres, req.apellidos].filter(Boolean).join(" ") || te("Usuario", "User")}
        </button>
        <p className="text-xs text-muted-foreground">{te("quiere seguirte", "wants to follow you")}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          onClick={() => void handleAcceptFollow(req.userId, notificationId)}
          className="h-9 bg-primary text-primary-foreground"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          {te("Aceptar", "Accept")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleRejectFollow(req.userId, notificationId)}
          className="h-9"
        >
          {te("Rechazar", "Decline")}
        </Button>
      </div>
    </div>
  )

  const renderNotificationRow = (n: Notification) => {
    const isPendingRequest = isPendingFollowSender(n.senderId, pendingUserIds)

    return (
      <div
        key={n.notificationId}
        className={`flex items-start gap-3 px-4 py-3 transition-colors ${!n.read ? "bg-primary/5" : ""} ${
          isPendingRequest ? "" : "hover:bg-muted/50"
        }`}
      >
        <button
          type="button"
          className="shrink-0"
          onClick={() => !isPendingRequest && handleNotificationClick(n)}
          disabled={isPendingRequest}
        >
          {n.senderProfilePicture || n.senderUsername ? (
            <Avatar className="h-10 w-10">
              <AvatarImage src={n.senderProfilePicture} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {n.senderUsername?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                !n.read ? "bg-primary/20" : "bg-muted"
              }`}
            >
              <Bell className={`h-4 w-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
            </div>
          )}
        </button>

        <button
          type="button"
          className="flex-1 min-w-0 text-left"
          onClick={() => !isPendingRequest && handleNotificationClick(n)}
          disabled={isPendingRequest}
        >
          <p className="text-sm text-foreground">{n.data || n.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
          </p>
        </button>

        {isPendingRequest ? (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => void handleAcceptFollow(n.senderId, n.notificationId)}
              className="h-9 bg-primary text-primary-foreground"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {te("Aceptar", "Accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleRejectFollow(n.senderId, n.notificationId)}
              className="h-9"
            >
              {te("Rechazar", "Decline")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {!n.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => void markAsRead(n.notificationId)}
                title={te("Marcar leída", "Mark read")}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => void deleteNotification(n.notificationId)}
              title={te("Eliminar", "Delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderList = (showPendingSections: boolean, list: Notification[]) => {
    const empty =
      list.length === 0 &&
      (!showPendingSections || (followRequests.length === 0 && eventInvites.length === 0))

    if (empty) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Bell className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{te("Sin notificaciones", "No notifications")}</p>
        </div>
      )
    }

    return (
      <div className="divide-y divide-border">
        {showPendingSections && followRequests.length > 0 && (
          <div className="bg-muted/30">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {te("Solicitudes de seguimiento", "Follow requests")}
            </p>
            {followRequests.map((req) => renderFollowRequestRow(req))}
          </div>
        )}
        {showPendingSections && (
          <EventInviteRows
            invites={eventInvites}
            respondingId={respondingEventId}
            te={te}
            onAccept={(id) => void handleRespondEventInvite(id, true)}
            onReject={(id) => void handleRespondEventInvite(id, false)}
          />
        )}
        {list.map((n) => renderNotificationRow(n))}
        {hasMore && list.length > 0 && activeTab !== "requests" && (
          <div className="px-4 py-4 flex justify-center">
            <Button type="button" variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {te("Cargando…", "Loading…")}
                </>
              ) : (
                te("Cargar más", "Load more")
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const requestsCount = followRequests.length + eventInvites.length

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
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-foreground">{te("Notificaciones", "Notifications")}</h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => void markAllAsRead()}>
              <CheckCheck className="h-4 w-4 mr-1" />
              {te("Marcar todo leído", "Mark all read")}
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as NotificationTab)}
        className="px-2 pt-3"
      >
        <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="all" className="text-xs">
            {te("Todas", "All")}
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-xs gap-1">
            <UserPlus className="h-3 w-3" />
            {te("Pendientes", "Pending")}
            {requestsCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0 text-[10px] text-primary-foreground">
                {requestsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="LIKE" className="text-xs gap-1">
            <Heart className="h-3 w-3" />
            {te("Me gusta", "Likes")}
          </TabsTrigger>
          <TabsTrigger value="FOLLOW" className="text-xs gap-1">
            <Users className="h-3 w-3" />
            {te("Seguimiento", "Follow")}
          </TabsTrigger>
          <TabsTrigger value="USER" className="text-xs gap-1">
            <User className="h-3 w-3" />
            {te("Usuarios", "Users")}
          </TabsTrigger>
          <TabsTrigger value="POST" className="text-xs gap-1">
            <FileText className="h-3 w-3" />
            {te("Posts", "Posts")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderList(true, activityNotifications)}
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          {requestsCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <UserPlus className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {te("No hay solicitudes pendientes", "No pending requests")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {followRequests.length > 0 && (
                <div className="bg-muted/30">
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {te("Seguimiento", "Follow")}
                  </p>
                  {followRequests.map((req) => renderFollowRequestRow(req))}
                </div>
              )}
              <EventInviteRows
                invites={eventInvites}
                respondingId={respondingEventId}
                te={te}
                onAccept={(id) => void handleRespondEventInvite(id, true)}
                onReject={(id) => void handleRespondEventInvite(id, false)}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="LIKE" className="mt-0">
          {renderList(false, filteredNotifications)}
        </TabsContent>

        <TabsContent value="FOLLOW" className="mt-0">
          {renderList(false, filteredNotifications)}
        </TabsContent>

        <TabsContent value="USER" className="mt-0">
          {renderList(false, filteredNotifications)}
        </TabsContent>

        <TabsContent value="POST" className="mt-0">
          {renderList(false, filteredNotifications)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
