"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"
import { extractApiRows } from "@/lib/extract-api-rows"
import { useAuth } from "@/lib/auth-context"
import type { Notification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Loader2, Trash2, Check, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useI18n } from "@/lib/i18n"

interface FollowRequest {
  userId: string
  username: string
  profilePictureUrl?: string
}

const NOTIFICATIONS_PAGE_SIZE = 20

export default function NotificationsPage() {
  const { te } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextPage, setNextPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadInitial = useCallback(async () => {
    if (!user?.userId) return
    setIsLoading(true)
    try {
      const [notifs, requests] = await Promise.all([
        api.get<unknown>(
          `/api/notifications/${user.userId}?page=0&size=${NOTIFICATIONS_PAGE_SIZE}`
        ),
        api.get<FollowRequest[]>("/api/follow/requests").catch(() => []),
      ])
      const list = extractApiRows<Notification>(notifs)
      setNotifications(list)
      setFollowRequests(Array.isArray(requests) ? requests : [])
      setNextPage(1)
      setHasMore(list.length >= NOTIFICATIONS_PAGE_SIZE)
    } catch {
      toast.error(te("Error al cargar notificaciones", "Error loading notifications"))
    } finally {
      setIsLoading(false)
    }
  }, [user?.userId])

  const loadMore = useCallback(async () => {
    if (!user?.userId || !hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const notifs = await api.get<unknown>(
        `/api/notifications/${user.userId}?page=${nextPage}&size=${NOTIFICATIONS_PAGE_SIZE}`
      )
      const list = extractApiRows<Notification>(notifs)
      setNotifications((prev) => [...prev, ...list] as Notification[])
      setNextPage((p) => p + 1)
      setHasMore(list.length >= NOTIFICATIONS_PAGE_SIZE)
    } catch {
      toast.error(te("Error al cargar más", "Error loading more"))
    } finally {
      setLoadingMore(false)
    }
  }, [user?.userId, hasMore, loadingMore, nextPage])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])
  useEffect(() => { setExpandedId(null) }, [pathname])
  useEffect(() => {
    const handleClickOutside = () => setExpandedId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleAcceptFollow = async (userId: string, notificationId?: string) => {
    try {
      await api.post(`/api/follow/accept/${userId}`)
      setFollowRequests(prev => prev.filter(r => r.userId !== userId))
      if (notificationId) setNotifications(prev => prev.filter(n => n.notificationId !== notificationId))
      toast.success(te("Solicitud aceptada", "Request accepted"))
    } catch {
      toast.error(te("Error al aceptar", "Error accepting"))
    }
  }

  const handleRejectFollow = async (userId: string, notificationId?: string) => {
    try {
      await api.post(`/api/follow/reject/${userId}`)
      setFollowRequests(prev => prev.filter(r => r.userId !== userId))
      if (notificationId) setNotifications(prev => prev.filter(n => n.notificationId !== notificationId))
      toast.success(te("Solicitud rechazada", "Request rejected"))
    } catch {
      toast.error(te("Error al rechazar", "Error rejecting"))
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.notificationId)
    if (notification.targetType === 'USER' && notification.targetId) {
      router.push(`/profile/${notification.targetId}`)
    } else if (notification.targetType === 'POST' && notification.targetId) {
      router.push(`/feed?post=${notification.targetId}`)
    } else if (notification.senderId) {
      router.push(`/profile/${notification.senderId}`)
    } else {
      router.push('/feed')
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`, {})
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, read: true } : n))
    } catch {
      toast.error(te("Error al marcar como leída", "Error marking as read"))
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.notificationId !== id))
      toast.success(te("Notificación eliminada", "Notification deleted"))
    } catch {
      toast.error(te("Error al eliminar", "Error deleting"))
    }
  }

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-16 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-bold text-foreground">{te("Notificaciones", "Notifications")}</h1>
      </div>

      {/* Solicitudes de follow pendientes */}
      {followRequests.length > 0 && (
        <div className="border-b border-border">
          <p className="px-4 pt-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <UserPlus className="h-3.5 w-3.5" /> {te("Solicitudes de seguimiento", "Follow requests")} ({followRequests.length})
          </p>
          {followRequests.map(req => (
            <div key={req.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={req.profilePictureUrl} />
                <AvatarFallback className="bg-primary/10 text-primary">{req.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{req.username}</p>
                <p className="text-xs text-muted-foreground">{te("quiere seguirte", "wants to follow you")}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAcceptFollow(req.userId)} className="h-8 bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5 mr-1" /> {te("Aceptar", "Accept")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRejectFollow(req.userId)} className="h-8">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length === 0 && followRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Bell className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{te("Sin notificaciones", "No notifications")}</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((n) => {
            const isPendingRequest = followRequests.some(r => r.userId === n.senderId)
            return (
              <div
                key={n.notificationId}
                onClick={(e) => {
                  if (isPendingRequest) return
                  e.stopPropagation()
                  if (expandedId === n.notificationId) {
                    setExpandedId(null)
                  } else {
                    setExpandedId(n.notificationId)
                    handleNotificationClick(n)
                  }
                }}
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${isPendingRequest ? "" : "cursor-pointer hover:bg-muted/50"} ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!n.read ? "bg-primary/20" : "bg-muted"}`}>
                  <Bell className={`h-4 w-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{n.data}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                {isPendingRequest ? (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm"
                      onClick={(e) => { e.stopPropagation(); void handleAcceptFollow(n.senderId, n.notificationId) }}
                      className="h-8 bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5 mr-1" /> {te("Aceptar", "Accept")}
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={(e) => { e.stopPropagation(); void handleRejectFollow(n.senderId, n.notificationId) }}
                      className="h-8">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : expandedId === n.notificationId ? (
                  <div className="flex items-center gap-1">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); markAsRead(n.notificationId) }}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); void deleteNotification(n.notificationId) }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          })}
          {hasMore && notifications.length > 0 && (
            <div className="px-4 py-4 flex justify-center border-t border-border">
              <Button
                type="button"
                variant="outline"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
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
      )}
    </div>
  )
}
