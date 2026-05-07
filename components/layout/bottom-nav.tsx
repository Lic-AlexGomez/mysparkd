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
  LayoutList,
  Clapperboard,
  Users,
  Activity,
  Heart,
  ThumbsUp,
  Clock,
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnreadChats } from "@/hooks/use-unread-chats"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useI18n } from "@/lib/i18n"
import { useExperienceMode, shouldShowNavItem } from "@/hooks/use-experience-mode"

const navItems = [
  // SOCIAL items
  { href: "/feed", labelKey: "bottomNav.feed", icon: Newspaper, modes: ['SOCIAL', 'BOTH'] },
  { href: "/stories", labelKey: "bottomNav.stories", icon: Clapperboard, modes: ['SOCIAL', 'BOTH'] },
  { href: "/groups", labelKey: "bottomNav.groups", icon: Users, modes: ['SOCIAL', 'BOTH'] },
  { href: "/events", labelKey: "bottomNav.events", icon: CalendarDays, modes: ['SOCIAL', 'BOTH'] },
  
  // DATING items
  { href: "/swipes", labelKey: "bottomNav.swipes", icon: Zap, modes: ['DATING', 'BOTH'] },
  { href: "/matches", labelKey: "bottomNav.matches", icon: Heart, modes: ['DATING', 'BOTH'] },
  { href: "/likes", labelKey: "bottomNav.likes", icon: ThumbsUp, modes: ['DATING', 'BOTH'] },
  { href: "/fastdate", labelKey: "bottomNav.fastdate", icon: Clock, modes: ['DATING', 'BOTH'] },
  
  // Common
  { href: "/chat", labelKey: "bottomNav.chat", icon: MessageCircle, modes: ['SOCIAL', 'DATING', 'BOTH'] },
  { href: "/profile", labelKey: "bottomNav.profile", icon: User, modes: ['SOCIAL', 'DATING', 'BOTH'] },
]

export function BottomNav() {
  const pathname = usePathname()
  const unreadChats = useUnreadChats()
  const features = useFeatureFlags()
  const { t } = useI18n()
  const experienceMode = useExperienceMode()

  const visibleNavItems = navItems.filter((item) => {
    if (item.href === "/trello" && !features.trelloPage) return false
    if (item.href === "/stories" && !features.storiesPage) return false
    if (item.href === "/groups" && !features.groupsPage) return false
    if (!item.modes.includes(experienceMode)) return false
    return true
  })

  if (pathname.startsWith('/chat/')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden overflow-hidden">
      <div className="flex items-center justify-around py-2 w-full">
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
