"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Calendar,
  Users,
  MessageCircle,
  Flame,
  Heart,
  User,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnreadChats } from "@/hooks/use-unread-chats"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAppearanceOptional } from "@/lib/appearance/appearance-provider"
import { DEFAULT_UI_PREFERENCES } from "@/lib/appearance/types"

type TabDef = {
  key: string
  href: string
  label: string
  icon: LucideIcon
  isActive: (p: string) => boolean
  avatar?: boolean
  badge?: number
}

function buildTabs(variant: "social" | "full"): TabDef[] {
  const social: TabDef[] = [
    { key: "feed", href: "/feed", label: "Feed", icon: Home, isActive: (p) => p.startsWith("/feed") },
    {
      key: "events",
      href: "/events",
      label: "Events",
      icon: Calendar,
      isActive: (p) => p.startsWith("/events") || p.startsWith("/tonight") || p.startsWith("/pulse"),
    },
    { key: "groups", href: "/groups", label: "Groups", icon: Users, isActive: (p) => p.startsWith("/groups") },
    {
      key: "chat",
      href: "/chat",
      label: "Chats",
      icon: MessageCircle,
      isActive: (p) => p === "/chat" || (p.startsWith("/chat") && !p.startsWith("/chat/")),
    },
    {
      key: "profile",
      href: "/profile",
      label: "Profile",
      icon: User,
      isActive: (p) => p === "/profile" || p.startsWith("/profile/"),
      avatar: true,
    },
  ]

  if (variant === "social") return social

  return [
    social[0],
    social[1],
    {
      key: "discover",
      href: "/swipes",
      label: "Discover",
      icon: Flame,
      isActive: (p) => p.startsWith("/swipes"),
    },
    social[2],
    social[3],
    {
      key: "matches",
      href: "/matches",
      label: "Matches",
      icon: Heart,
      isActive: (p) => p.startsWith("/matches") || p.startsWith("/likes"),
    },
    social[4],
  ]
}

function FlatTab({
  tab,
  active,
  showDot,
}: {
  tab: TabDef
  active: boolean
  showDot: boolean
}) {
  const { user } = useAuth()
  const Icon = tab.icon

  return (
    <Link
      href={tab.href}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 px-0.5 pb-2 pt-2 transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <div className="relative flex h-7 w-7 items-center justify-center">
        {tab.avatar ? (
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.profilePictureUrl} alt={user?.nombres} className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-[10px] text-primary">
              {user?.nombres?.[0]?.toUpperCase() ?? <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Icon className={cn("h-5 w-5", active && "fill-primary/15")} strokeWidth={active ? 2.25 : 1.85} />
        )}
        {!!tab.badge && tab.badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-secondary px-0.5 text-[7px] font-bold text-black">
            {tab.badge > 99 ? "99+" : tab.badge}
          </span>
        )}
      </div>
      <span className="w-full truncate text-center text-[10px] font-semibold leading-none tracking-wide">
        {tab.label}
      </span>
      <span
        className={cn(
          "mt-0.5 h-1 w-1 rounded-full transition-opacity",
          showDot && active ? "bg-primary opacity-100" : "opacity-0"
        )}
        aria-hidden
      />
    </Link>
  )
}

export function ClassicFlatNav({ variant = "full" }: { variant?: "social" | "full" }) {
  const pathname = usePathname()
  const unreadChats = useUnreadChats()
  const uiPrefs = useAppearanceOptional()?.uiPrefs ?? DEFAULT_UI_PREFERENCES
  const showDot = uiPrefs.activeIndicator === "dot" || uiPrefs.activeIndicator === "glow"

  const tabs = buildTabs(variant).map((t) =>
    t.key === "chat" ? { ...t, badge: unreadChats } : t
  )

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 backdrop-blur-md"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex h-[58px] max-w-lg items-stretch px-1 sm:max-w-xl lg:max-w-2xl">
        {tabs.map((tab) => (
          <FlatTab key={tab.key} tab={tab} active={tab.isActive(pathname)} showDot={showDot} />
        ))}
      </div>
    </nav>
  )
}
