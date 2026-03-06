"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Zap, LogOut, Settings, User, Crown, Search, Flame } from "lucide-react"
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
        notificationId: n.senderId + n.createdAt,
        type: 'like',
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
    const interval = setInterval(fetchNotifications, 60000) // Cambiar de 30s a 60s
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    // El backend no tiene endpoint para marcar como leída por ID generado
    // Solo refrescar las notificaciones
    fetchNotifications()
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

  const primaryPhoto = user?.photos?.find((p) => p.isPrimary || p.primary)
  const initials = user
    ? `${user.nombres?.[0] || ""}${user.apellidos?.[0] || ""}`.toUpperCase()
    : "?"

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md lg:pl-24 xl:pl-76 shadow-sm">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_rgba(0,229,255,0.3)]">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Sparkd</span>
      </div>

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
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground shadow-[0_0_8px_rgba(217,70,239,0.6)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="sr-only">Notificaciones</span>
          </Button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="font-semibold text-foreground">
                    Notificaciones
                  </h3>
                  <Link
                    href="/notifications"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setShowNotifications(false)}
                  >
                    Ver todas
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Sin notificaciones
                    </p>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <Link
                        key={n.notificationId}
                        href={getNotificationLink(n)}
                        onClick={() => {
                          markAsRead(n.notificationId)
                          setShowNotifications(false)
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                          !n.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {n.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(n.createdAt).toLocaleString("es", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </>
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
                  src={primaryPhoto?.url}
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
            {console.log(user)}
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
