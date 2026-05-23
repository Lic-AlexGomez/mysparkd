"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Zap, LogOut, Settings, User, Crown, Search, Flame, BarChart3, Users, Bookmark, X, Check, CheckCheck, Heart, MessageCircle, UserPlus, Repeat2, AtSign, LayoutList, Globe, Compass } from "lucide-react"
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
import { useEffect, useState, useCallback, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { api } from "@/lib/api"
import { extractApiRows } from "@/lib/extract-api-rows"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { formatDistanceToNow } from "date-fns"
import { ar, bn, enUS, es, fr, hi, ptBR, ru, zhCN } from "date-fns/locale"
import { TOP_10_LANGUAGES, useI18n } from "@/lib/i18n"

type NavNotification = {
  notificationId: string
  type: string
  message: string
  read: boolean
  createdAt: string
  relatedUserId?: string
  relatedUsername?: string
  targetId?: string
  targetType?: string
}

const DATE_LOCALE_BY_LANGUAGE = {
  en: enUS,
  zh: zhCN,
  hi,
  es,
  fr,
  ar,
  bn,
  pt: ptBR,
  ru,
  ur: enUS,
} as const

export function TopNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useI18n()
  const features = useFeatureFlags()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NavNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationsPanelId = useId()
  const notificationsTitleId = useId()
  const notificationsPanelRef = useRef<HTMLDivElement>(null)
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const sync = () => setIsNarrowViewport(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return
    try {
      const data = extractApiRows<Record<string, unknown>>(
        await api.get<unknown>(
          `/api/notifications/${user.userId}?page=0&size=20`
        )
      )
      const mapped = data.map((n) => {
        const title = String(n.title ?? "")
        const tl = title.toLowerCase()
        return {
          notificationId: String(n.notificationId ?? n.senderId ?? "") + String(n.createdAt ?? ""),
          type: tl.includes("like")
            ? "like"
            : tl.includes("comment")
              ? "comment"
              : tl.includes("follow")
                ? "follow"
                : tl.includes("repost")
                  ? "repost"
                  : tl.includes("mencion") || tl.includes("mention")
                    ? "mention"
                    : tl.includes("reacci")
                      ? "reaction"
                      : "default",
          message: String(n.data ?? ""),
          read: Boolean(n.read),
          createdAt: String(n.createdAt ?? ""),
          relatedUserId: n.senderId as string | undefined,
          relatedUsername: n.senderUsername as string | undefined,
          targetId: n.targetId as string | undefined,
          targetType: n.targetType as string | undefined,
        }
      })
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
      document.addEventListener("click", handleClickOutside)
    }, 0)

    return () => document.removeEventListener("click", handleClickOutside)
  }, [showNotifications])

  useEffect(() => {
    if (!showNotifications) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotifications(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [showNotifications])

  useEffect(() => {
    if (!showNotifications) return
    if (!window.matchMedia("(max-width: 767px)").matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [showNotifications])

  useEffect(() => {
    if (!showNotifications) return
    if (!window.matchMedia("(max-width: 767px)").matches) return
    const el = notificationsPanelRef.current
    if (!el) return
    const t = requestAnimationFrame(() => {
      el.focus()
    })
    return () => cancelAnimationFrame(t)
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

  const getNotificationLink = (notification: NavNotification): string => {
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
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md shadow-sm">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_rgba(0,229,255,0.3)]">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Sparkd!</span>
      </Link>

      {features.searchPage && pathname !== '/search' ? (
        <div className="hidden lg:flex flex-1 items-center justify-center max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("nav.searchPlaceholder")}
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
            aria-label={t("nav.searchAria")}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label={t("nav.language")}
              title={t("nav.language")}
            >
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 bg-card border-border">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {t("nav.language")}
            </div>
            <DropdownMenuSeparator />
            {TOP_10_LANGUAGES.map((option) => (
              <DropdownMenuItem
                key={option.code}
                onClick={() => setLanguage(option.code)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-sm">
                  {option.nativeLabel}
                  <span className="ml-1 text-xs text-muted-foreground">({option.englishLabel})</span>
                </span>
                {language === option.code && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
        {/* Discover */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary hover:bg-primary/10"
          asChild
          aria-label={t("nav.discover")}
          title={t("nav.discover")}
        >
          <Link href="/activity">
            <Compass className="h-5 w-5" />
          </Link>
        </Button>
        {/* Notifications */}
        <div className="relative mr-1 sm:mr-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (pathname === "/notifications") return
              setShowNotifications(!showNotifications)
            }}
            data-notifications-button
            aria-haspopup="dialog"
            aria-expanded={showNotifications}
            aria-controls={showNotifications ? notificationsPanelId : undefined}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-black shadow-[0_0_8px_rgba(217,70,239,0.6)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="sr-only">{t("nav.notifications")}</span>
          </Button>

          {showNotifications && typeof document !== 'undefined' && createPortal(
            <>
              <div
                className="fixed top-16 left-0 right-0 bottom-0 z-[55] bg-black/45 backdrop-blur-sm md:hidden"
                aria-hidden
                data-notifications-backdrop
                onClick={() => setShowNotifications(false)}
              />
              <div
                id={notificationsPanelId}
                ref={notificationsPanelRef}
                role="dialog"
                aria-modal={isNarrowViewport}
                aria-labelledby={notificationsTitleId}
                tabIndex={-1}
                className="fixed left-0 right-0 top-16 bottom-0 z-[60] flex flex-col overflow-hidden border-x border-b border-border bg-card px-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] shadow-2xl shadow-black/25 outline-none [padding-left:max(0.5rem,env(safe-area-inset-left,0px))] [padding-right:max(0.5rem,env(safe-area-inset-right,0px))] rounded-b-2xl sm:px-3 md:bottom-auto md:fixed md:left-auto md:right-4 md:top-16 md:z-[60] md:mt-2 md:max-h-[min(420px,80vh)] md:w-96 md:rounded-2xl md:border md:px-0 md:pb-0 md:pt-0"
                data-notifications-dropdown
              >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/80 px-3 py-3 backdrop-blur-sm md:px-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" aria-hidden />
                  <h3 id={notificationsTitleId} className="font-semibold text-foreground text-sm">
                    {t("nav.notifications")}
                  </h3>
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
                      {t("nav.markAllRead")}
                    </button>
                  )}
                  <Link
                    href="/notifications"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowNotifications(false)}
                  >
                    {t("nav.viewAll")}
                  </Link>
                </div>
              </div>

              {/* Lista */}
              <div className="min-h-0 flex-1 divide-y divide-border/50 overflow-y-auto overscroll-contain md:max-h-[420px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t("nav.noNotifications")}</p>
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
                          {(() => {
                            try {
                              return formatDistanceToNow(new Date(n.createdAt), {
                                addSuffix: true,
                                locale: DATE_LOCALE_BY_LANGUAGE[language],
                              })
                            } catch {
                              return ""
                            }
                          })()}
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
            </>,
            document.body
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
                <User className="h-4 w-4" /> {t("nav.myProfile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/saved" className="flex items-center gap-2 cursor-pointer">
                <Bookmark className="h-4 w-4" /> {t("nav.saved")}
              </Link>
            </DropdownMenuItem>
            {features.analyticsPage && (
              <DropdownMenuItem asChild>
                <Link href="/analytics" className="flex items-center gap-2 cursor-pointer">
                  <BarChart3 className="h-4 w-4" /> {t("nav.analytics")}
                </Link>
              </DropdownMenuItem>
            )}
            {features.groupsPage && (
              <DropdownMenuItem asChild>
                <Link href="/groups" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" /> {t("nav.groups")}
                </Link>
              </DropdownMenuItem>
            )}
            {features.trelloPage && (
              <DropdownMenuItem asChild>
                <Link href="/trello" className="flex items-center gap-2 cursor-pointer">
                  <LayoutList className="h-4 w-4" /> Trello
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/events" className="flex items-center gap-2 cursor-pointer">
                <Flame className="h-4 w-4" /> {t("nav.events")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" /> {t("nav.settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/premium" className="flex items-center gap-2 cursor-pointer">
                <Crown className="h-4 w-4" /> {t("nav.premium")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" /> {t("nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
