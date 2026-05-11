"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Newspaper,
  Zap,
  Heart,
  MessageCircle,
  User,
  CalendarDays,
  LayoutDashboard,
  ShieldCheck,
  Crown,
  LayoutList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useUnreadChats } from "@/hooks/use-unread-chats"
import { useI18n } from "@/lib/i18n"
import { useExperienceMode, shouldShowNavItem } from "@/hooks/use-experience-mode"

const navItems = [
  // SOCIAL items
  { href: "/feed", labelKey: "sidebar.feed", icon: Newspaper, modes: ['SOCIAL', 'BOTH'] },
  { href: "/events", labelKey: "sidebar.events", icon: CalendarDays, modes: ['SOCIAL', 'BOTH'] },
  
  // DATING items
  { href: "/swipes", labelKey: "sidebar.swipes", icon: Zap, modes: ['DATING', 'BOTH'] },
  { href: "/matches", labelKey: "sidebar.matches", icon: Heart, modes: ['DATING', 'BOTH'] },

  // Common items
  { href: "/chat", labelKey: "sidebar.chat", icon: MessageCircle, modes: ['SOCIAL', 'DATING', 'BOTH'] },
  { href: "/trello", labelKey: "sidebar.trello", icon: LayoutList, modes: ['SOCIAL', 'DATING', 'BOTH'] },
  { href: "/profile", labelKey: "sidebar.profile", icon: User, modes: ['SOCIAL', 'DATING', 'BOTH'] },
  { href: "/premium", labelKey: "sidebar.premium", icon: Crown, modes: ['DATING', 'BOTH'] },
]

export function SidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const features = useFeatureFlags()
  const unreadChats = useUnreadChats()
  const { t } = useI18n()
  const experienceMode = useExperienceMode()

  const filteredNavItems = navItems.filter(item => {
    if (item.href === '/search' && !features.searchPage) return false
    if (item.href === '/trello' && !features.trelloPage) return false
    if (item.href === '/stories' && !features.storiesPage) return false
    if (item.href === '/groups' && !features.groupsPage) return false
    if (!item.modes.includes(experienceMode)) return false
    return true
  })

  // Un solo item de panel según el rol
  const panelItem = features.dashboard
    ? { href: '/dashboard', labelKey: 'sidebar.adminPanel', icon: LayoutDashboard }
    : features.managerPanel
    ? { href: '/manager', labelKey: 'sidebar.managerPanel', icon: ShieldCheck }
    : null

  const allNavItems = panelItem
    ? [panelItem, ...filteredNavItems]
    : filteredNavItems

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 bg-gradient-to-b from-background via-background to-muted/20 border-r border-primary/10 lg:w-20 xl:w-72 shadow-xl shadow-primary/5">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center xl:justify-start xl:gap-3 xl:px-6 border-b border-primary/10">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-gradient-to-br from-primary to-secondary opacity-50" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-2xl">
            <Zap className="h-7 w-7 text-black" />
          </div>
        </div>
        <span className="hidden py-12  xl:block text-2xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Sparkd</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 xl:px-4 py-6">
        <ul className="flex flex-col gap-3">
          {allNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/") ||
              (item.href === "/events" && pathname.startsWith("/fastdate")) ||
              (item.href === "/matches" && pathname.startsWith("/likes"))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center justify-center xl:justify-start gap-4 rounded-2xl px-4 py-4 xl:py-3 text-sm font-semibold transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-primary to-secondary text-black shadow-lg shadow-primary/30 scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-secondary blur-xl opacity-30" />
                  )}
                  <div className="relative z-10">
                    <item.icon className="h-6 w-6 xl:h-5 xl:w-5" />
                    {item.href === '/chat' && unreadChats > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground px-0.5">
                        {unreadChats > 99 ? '99+' : unreadChats}
                      </span>
                    )}
                  </div>
                  <span className="hidden xl:block relative z-10">{t(item.labelKey)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
