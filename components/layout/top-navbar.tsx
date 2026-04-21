"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Zap, LogOut, Settings, User, Crown, Search, Flame, BarChart3, Users, Bookmark, X, CheckCheck, Heart, MessageCircle, UserPlus, Repeat2, AtSign } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"
import type { Notification } from "@/lib/types"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function TopNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const features = useFeatureFlags()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return
    try {
      const data = await api.get<any[]>(
        `/api/notifications/${user.userId}`
      )
      const mapped = data.map(n => ({
        notificationId: n.notificationId || (n.senderId + n.createdAt),
        type: n.title?.toLowerCase().includes('like') ? 'like'
          : n.title?.toLowerCase().includes('comment') ? 'comment'
          : n.title?.toLowerCase().includes('follow') ? 'follow'
          : n.title?.toLowerCase().includes('repost') ? 'repost'
          : n.title?.toLowerCase().includes('mencion') || n.title?.toLowerCase().includes('mention') ? 'mention'
          : n.title?.toLowerCase().includes('reacci') ? 'reaction'
          : 'default',
        message: n.data,
        read: n.read,
        createdAt: n.createdAt,
        relatedUserId: n.senderId,
        relatedUsername: n.senderUsername,
        targetId: n.targetId,
        targetType: n.targetType
      }))
      setNotifications(mapped)
      setUnreadCount(mapped.filter((n) => !n.read).length)
    } catch {
      // silent fail
    }
  }, [user?.userId])

  useEffect(() => {
    fetchNotifications()
    // Solo hacer polling si la ventana está visible
    const interval = setInterval(() => {
      if (!document.hidden) fetchNotifications()
    }, 120000) // 2 minutos
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    if (pathname === '/notifications') setShowNotifications(false)
  }, [pathname])

  useEffect(() => {
    if (!showNotifications) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-notifications-dropdown]') && !target.closest('[data-notifications-button]')) {
        setShowNotifications(false)
      }
    }
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
    
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showNotifications])

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.notificationId === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    try { await api.put(`/api/notifications/${notificationId}/read`, {}) } catch {}
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    notifications.filter(n => !n.read).forEach(n => {
      api.put(`/api/notifications/${n.notificationId}/read`, {}).catch(() => {})
    })
  }

  const deleteNotification = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setNotifications(prev => {
      const n = prev.find(n => n.notificationId === notificationId)
      if (n && !n.read) setUnreadCount(c => Math.max(0, c - 1))
      return prev.filter(n => n.notificationId !== notificationId)
    })
    api.delete(`/api/notifications/${notificationId}`).catch(() => {})
  }

  const getNotificationLink = (notification: Notification): string => {
    if (!notification.targetId || !notification.targetType) {
      return `/profile/${notification.relatedUserId}`
    }

    switch (notification.targetType) {
      case 'POST':
        return `/feed?post=${notification.targetId}`
      case 'COMMENT':
      case 'REPLY':
        return `/feed?comment=${notification.targetId}`
      default:
        return `/profile/${notification.relatedUserId}`
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-3.5 w-3.5 text-red-400" />
      case 'comment': return <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
      case 'follow': return <UserPlus className="h-3.5 w-3.5 text-green-400" />
      case 'repost': return <Repeat2 className="h-3.5 w-3.5 text-primary" />
      case 'mention': return <AtSign className="h-3.5 w-3.5 text-secondary" />
      case 'reaction': return <Heart className="h-3.5 w-3.5 text-secondary" />
      default: return <Bell className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const avatarUrl = user?.profilePictureUrl || user?.photos?.find((p) => p.isPrimary || p.primary)?.url
  const initials = user
    ? `${user.nombres?.[0] || ""}${user.apellidos?.[0] || ""}`.toUpperCase()
    : "?"

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md lg:pl-24 xl:pl-76 shadow-sm">
      {/* Mobile logo */}
      <Link href="/feed" className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_rgba(0,229,255,0.3)]">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Sparkd</span>
      </Link>

      {features.searchPage && pathname !== '/search' ? (
        <div className="hidden lg:flex flex-1 items-center justify-center max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar en Sparkd..."
              onClick={() => router.push('/search')}
              readOnly
              className="w-full h-9 pl-10 pr-4 rounded-full bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1" />
      )}

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search button - mobile */}
        {features.searchPage && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/search')}
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        {/* Trending button - desktop only */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"
          asChild
        >
          <Link href="/feed">
            <Flame className="h-5 w-5" />
          </Link>
        </Button>
        {/* Notifications */}
        <div className="relative mr-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (pathname === '/notifications') return
              setShowNotifications(!showNotifications)
            }}
            data-notifications-button
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-black shadow-[0_0_8px_rgba(217,70,239,0.6)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="sr-only">Notificaciones</span>
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20" data-notifications-dropdown>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black px-1">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Leer todo
                    </button>
                  )}
                  <Link
                    href="/notifications"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowNotifications(false)}
                  >
                    Ver todas
                  </Link>
                </div>
              </div>

              {/* Lista */}
              <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Sin notificaciones</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div key={n.notificationId} className={`group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 ${!n.read ? 'bg-primary/5' : ''}`}>
                      {/* Indicador no leída */}
                      {!n.read && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                      {/* Ícono tipo */}
                      <div className="mt-0.5 h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {getNotificationIcon(n.type)}
                      </div>
                      {/* Contenido — clickeable */}
                      <Link
                        href={getNotificationLink(n)}
                        className="flex-1 min-w-0"
                        onClick={() => { markAsRead(n.notificationId); setShowNotifications(false) }}
                      >
                        <p className={`text-sm leading-snug ${!n.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {n.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(() => { try { return formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es }) } catch { return '' } })()}
                        </p>
                      </Link>
                      {/* Botón eliminar */}
                      <button
                        onClick={(e) => deleteNotification(n.notificationId, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center mt-0.5"
                        title="Eliminar"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0"
            >
              <Avatar className="h-9 w-9 border-2 border-primary ring-2 ring-primary/20">
                <AvatarImage
                  src={avatarUrl}
                  alt={user?.nombres || "Avatar"}
                />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-card border-border"
          >
            
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">
                {user?.nombres} {user?.apellidos}
                
              </p>
              <p className="text-xs text-muted-foreground">Nivel {user?.verificationLevel || 1}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" /> Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/saved" className="flex items-center gap-2 cursor-pointer">
                <Bookmark className="h-4 w-4" /> Guardados
              </Link>
            </DropdownMenuItem>
            {features.analyticsPage && (
              <DropdownMenuItem asChild>
                <Link href="/analytics" className="flex items-center gap-2 cursor-pointer">
                  <BarChart3 className="h-4 w-4" /> Analíticas
                </Link>
              </DropdownMenuItem>
            )}
            {features.groupsPage && (
              <DropdownMenuItem asChild>
                <Link href="/groups" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" /> Grupos
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" /> Configuracion
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/premium" className="flex items-center gap-2 cursor-pointer">
                <Crown className="h-4 w-4" /> Premium
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" /> Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
