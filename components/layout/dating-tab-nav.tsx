"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap, Heart, Calendar, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAppearanceOptional } from "@/lib/appearance/appearance-provider"
import { DEFAULT_UI_PREFERENCES } from "@/lib/appearance/types"
import { isStoriesRoute } from "@/lib/is-stories-route"

const TABS = [
  {
    key: "discover",
    href: "/swipes",
    label: "Discover",
    icon: Zap,
    activeColor: "text-primary",
    dotColor: "bg-primary",
    isActive: (p: string) => p.startsWith("/swipes"),
  },
  {
    key: "likes",
    href: "/likes",
    label: "Likes",
    icon: Heart,
    activeColor: "text-pink-400",
    dotColor: "bg-pink-400",
    isActive: (p: string) => p.startsWith("/likes") || p.startsWith("/matches"),
  },
  {
    key: "events",
    href: "/events",
    label: "Events",
    icon: Calendar,
    activeColor: "text-violet-400",
    dotColor: "bg-violet-400",
    isActive: (p: string) =>
      p.startsWith("/events") || p.startsWith("/tonight") || p.startsWith("/pulse"),
  },
  {
    key: "chats",
    href: "/chat",
    label: "Chats",
    icon: MessageCircle,
    activeColor: "text-cyan-400",
    dotColor: "bg-cyan-400",
    isActive: (p: string) => p === "/chat" || (p.startsWith("/chat") && !p.startsWith("/chat/")),
  },
  {
    key: "profile",
    href: "/profile",
    label: "Profile",
    icon: User,
    activeColor: "text-foreground",
    dotColor: "bg-muted-foreground",
    isActive: (p: string) => p === "/profile" || p.startsWith("/profile/"),
    avatar: true,
  },
] as const

export function DatingTabNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const uiPrefs = useAppearanceOptional()?.uiPrefs ?? DEFAULT_UI_PREFERENCES
  const showLabels = uiPrefs.showLabels !== false

  if (isStoriesRoute(pathname) || pathname.startsWith("/chat/")) {
    return null
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 pt-2"
      aria-label="Navegación dating"
    >
      <div className="flex w-full max-w-md items-center justify-between rounded-[2rem] border border-border/80 bg-card/95 px-2 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname)
          const Icon = tab.icon
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 transition-colors",
                active ? tab.activeColor : "text-muted-foreground"
              )}
            >
              <div className="flex h-7 w-7 items-center justify-center">
                {tab.avatar ? (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.profilePictureUrl} alt={user?.nombres} className="object-cover" />
                    <AvatarFallback className="bg-primary/20 text-[10px] text-primary">
                      {user?.nombres?.[0]?.toUpperCase() ?? <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.85} />
                )}
              </div>
              {showLabels ? (
                <span className="text-[9px] font-semibold uppercase tracking-wide">{tab.label}</span>
              ) : null}
              <span
                className={cn(
                  "h-1 w-1 rounded-full",
                  active ? tab.dotColor : "bg-transparent"
                )}
                aria-hidden
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
