"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Notification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Loader2, Trash2, Check, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface FollowRequest {
  userId: string
  username: string
  profilePictureUrl?: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return
    try {
      const [notifs, requests] = await Promise.all([
        api.get<any[]>(`/api/notifications/${user.userId}`),
        api.get<FollowRequest[]>('/api/follow/requests').catch(() => [])
      ])
      setNotifications(notifs)
      setFollowRequests(requests)
    } catch {
      toast.error("Error al cargar notificaciones")
    } finally {
      setIsLoading(false)
    }
  }, [user?.userId])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])
  useEffect(() => { setExpandedId(null) }, [pathname])
  useEffect(() => {
    const handleClickOutside = () => setExpandedId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleAcceptFollow = async (userId: string) => {
    try {
      await api.post(`/api/follow/accept/${userId}`)
      setFollowRequests(prev => prev.filter(r => r.userId !== userId))
      toast.success("Solicitud aceptada")
    } catch {
      toast.error("Error al aceptar")
    }
  }

  const handleRejectFollow = async (userId: string) => {
    try {
      await api.post(`/api/follow/reject/${userId}`)
      setFollowRequests(prev => prev.filter(r => r.userId !== userId))
      toast.success("Solicitud rechazada")
    } catch {
      toast.error("Error al rechazar")
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
      toast.error("Error al marcar como leída")
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.notificationId !== id))
      toast.success("Notificacion eliminada")
    } catch {
      toast.error("Error al eliminar")
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
        <h1 className="text-lg font-bold text-foreground">Notificaciones</h1>
      </div>

      {/* Solicitudes de follow pendientes */}
      {followRequests.length > 0 && (
        <div className="border-b border-border">
          <p className="px-4 pt-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <UserPlus className="h-3.5 w-3.5" /> Solicitudes de seguimiento ({followRequests.length})
          </p>
          {followRequests.map(req => (
            <div key={req.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={req.profilePictureUrl} />
                <AvatarFallback className="bg-primary/10 text-primary">{req.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{req.username}</p>
                <p className="text-xs text-muted-foreground">quiere seguirte</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAcceptFollow(req.userId)} className="h-8 bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5 mr-1" /> Aceptar
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
          <p className="text-muted-foreground">Sin notificaciones</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n.notificationId}
              onClick={(e) => {
                e.stopPropagation()
                if (expandedId === n.notificationId) {
                  setExpandedId(null)
                } else {
                  setExpandedId(n.notificationId)
                  handleNotificationClick(n)
                }
              }}
              className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/50 ${!n.read ? "bg-primary/5" : ""}`}
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
              {expandedId === n.notificationId && (
                <div className="flex items-center gap-1">
                  {!n.read && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.notificationId) }}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.notificationId) }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
