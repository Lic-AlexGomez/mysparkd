"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Newspaper,
  Zap,
  Calendar,
  CalendarDays,
  MessageCircle,
  User,
  Users,
  LayoutList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnreadChats } from "@/hooks/use-unread-chats"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useI18n } from "@/lib/i18n"

const navItems = [
  { href: "/feed", labelKey: "bottomNav.feed", icon: Newspaper },
  { href: "/swipes", labelKey: "bottomNav.swipes", icon: Zap },
  { href: "/events", labelKey: "bottomNav.events", icon: CalendarDays },
  { href: "/chat", labelKey: "bottomNav.chat", icon: MessageCircle },
  { href: "/groups", labelKey: "bottomNav.groups", icon: Users, featureFlag: "groupsPage" },
  { href: "/trello", labelKey: "bottomNav.trello", icon: LayoutList },
  { href: "/profile", labelKey: "bottomNav.profile", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const unreadChats = useUnreadChats()
  const features = useFeatureFlags()
  const { t } = useI18n()

  const visibleNavItems = navItems.filter((item) => {
    if ('featureFlag' in item && item.featureFlag && !features[item.featureFlag as keyof typeof features]) return false
    if (item.href === "/trello" && !features.trelloPage) return false
    return true
  })

  if (pathname.startsWith('/chat/')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around py-2">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/") || (item.href === '/events' && pathname.startsWith('/fastdate')) || (item.href === '/matches' && pathname.startsWith('/likes'))
          const showBadge = item.href === '/chat' && unreadChats > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1.5 sm:px-2.5 py-1.5 text-[10px] sm:text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={t(item.labelKey)}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground px-0.5">
                    {unreadChats > 99 ? '99+' : unreadChats}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
