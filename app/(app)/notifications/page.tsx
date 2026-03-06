"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { notificationService } from "@/lib/services/notification"
import type { Notification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Bell, Loader2, Trash2, Check } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return
    try {
      const data = await api.get<any[]>(
        `/api/notifications/${user.userId}`
      )
      console.log('Notificaciones del backend:', data)
      const mapped = data.map(n => {
        console.log('Notificación individual:', n)
        return {
          notificationId: n.senderId + n.createdAt,
          type: n.type || 'like',
          message: n.data,
          read: n.read,
          createdAt: n.createdAt,
          relatedUserId: n.senderId,
          relatedUsername: n.senderUsername,
          targetId: n.targetId || n.postId || n.commentId,
          targetType: n.targetType
        }
      })
      console.log('Notificaciones mapeadas:', mapped)
      setNotifications(mapped)
    } catch (error) {
      console.log('Error al obtener notificaciones del backend, usando locales:', error)
      const localNotifs = notificationService.getNotifications(user.userId)
      console.log('Notificaciones locales:', localNotifs)
      setNotifications(localNotifs.map(n => ({
        notificationId: n.id,
        type: n.type,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt,
        relatedUserId: n.relatedUserId || '',
        relatedUsername: '',
        targetId: n.targetId,
        targetType: n.targetType
      })))
    } finally {
      setIsLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    setExpandedId(null)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = () => setExpandedId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.notificationId)
    
    // Navegar según el tipo de notificación
    if (notification.type === 'like' || notification.type === 'comment') {
      // Como el backend no devuelve targetId, ir al feed general
      router.push('/feed')
    } else if (notification.type === 'follow') {
      router.push(`/profile/${notification.relatedUserId}`)
    } else if (notification.type === 'match') {
      router.push('/matches')
    } else {
      router.push('/feed')
    }
  }

  const markAsRead = async (id: string) => {
    // Backend no soporta marcar como leída individualmente
    fetchNotifications()
  }

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`)
      fetchNotifications()
      toast.success("Notificacion eliminada")
    } catch {
      toast.error("Error al eliminar")
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
        <h1 className="text-lg font-bold text-foreground">Notificaciones</h1>
      </div>

      {notifications.length === 0 ? (
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
              className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/50 ${
                !n.read ? "bg-primary/5" : ""
              }`}
            >
              <div
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  !n.read ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <Bell
                  className={`h-4 w-4 ${
                    !n.read ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              {expandedId === n.notificationId && (
                <div className="flex items-center gap-1">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(n.notificationId)
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span className="sr-only">Marcar como leida</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(n.notificationId)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Eliminar</span>
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
